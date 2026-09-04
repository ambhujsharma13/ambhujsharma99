import DiscussionTopicsList from "./DiscussionTopicsList";
import MarketSidebar from "./MarketSidebar";

export default function LeftColumn({ activeKey }) {
  return (
    <div className="w-52 shrink-0">
      <DiscussionTopicsList />
      <MarketSidebar activeKey={activeKey} />
    </div>
  );
}
