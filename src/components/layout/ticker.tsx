"use client";

const TICKER_ITEMS = [
  "OPEN RATE  54.7% ↑",
  "CTR  18.9%",
  "REVENUE  ₹24.5L ↑",
  "CAMPAIGNS SENT  34  +18.5%",
  "CUSTOMERS  12.8K ↑",
  "SEGMENTS  7 ACTIVE",
];

function TickerTrack() {
  return (
    <>
      {TICKER_ITEMS.map((item) => (
        <span
          key={item}
          className="mr-0.5 inline-block shrink-0 bg-[#111110] px-3 py-[3px] font-mono text-[10px] tracking-[0.05em] text-[var(--color-signal)]"
        >
          {item}
        </span>
      ))}
    </>
  );
}

export function Ticker() {
  return (
    <div className="mx-4 hidden min-w-0 flex-1 overflow-hidden md:block">
      <div
        className="flex w-max whitespace-nowrap"
        style={{
          animation: "ticker 25s linear infinite",
          animationDelay: "400ms",
        }}
      >
        <TickerTrack />
        <TickerTrack />
      </div>
    </div>
  );
}
