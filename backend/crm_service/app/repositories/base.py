from typing import Any, Generic, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import Select, and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class QueryBuilder:
    """Translates agent filter specs into SQLAlchemy clauses. Never accepts raw SQL."""

    OPERATORS = {
        "eq": lambda col, val: col == val,
        "neq": lambda col, val: col != val,
        "gt": lambda col, val: col > val,
        "gte": lambda col, val: col >= val,
        "lt": lambda col, val: col < val,
        "lte": lambda col, val: col <= val,
        "in": lambda col, val: col.in_(val if isinstance(val, list) else [val]),
        "like": lambda col, val: col.ilike(f"%{val}%"),
    }

    @classmethod
    def apply_filters(cls, model: Type[T], filters: dict[str, Any] | list[dict[str, Any]]) -> list[Any]:
        clauses: list[Any] = []
        filter_list = filters if isinstance(filters, list) else [filters]
        for spec in filter_list:
            field = spec.get("field")
            operator = spec.get("operator", "eq")
            value = spec.get("value")
            if not field or not hasattr(model, field):
                continue
            column = getattr(model, field)
            op_fn = cls.OPERATORS.get(operator)
            if op_fn:
                clauses.append(op_fn(column, value))
        return clauses

    @classmethod
    def build_query(cls, model: Type[T], filters: dict[str, Any] | list[dict[str, Any]] | None = None) -> Select:
        stmt = select(model)
        if filters:
            clauses = cls.apply_filters(model, filters)
            if clauses:
                stmt = stmt.where(and_(*clauses))
        return stmt


class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model: Type[T]):
        self.session = session
        self.model = model

    async def get_by_id(self, id: UUID) -> Optional[T]:
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        result = await self.session.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, obj: T) -> T:
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: T) -> T:
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: UUID) -> bool:
        obj = await self.get_by_id(id)
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.flush()
        return True

    async def count(self) -> int:
        from sqlalchemy import func

        result = await self.session.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()
