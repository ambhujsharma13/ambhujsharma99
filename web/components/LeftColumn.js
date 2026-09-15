import DiscussionBox from "./DiscussionBox";
import MarketSidebar from "./MarketSidebar";

export default function LeftColumn({ activeKey }) {
  return (
    <div className="w-52 shrink-0">
      <DiscussionBox />
      <MarketSidebar activeKey={activeKey} />
    </div>
  );
}