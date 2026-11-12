import Skeleton from "./skeleton";
interface StatsSkeletonProps {
  count?: number;
  containerClassName?: string;
  cardClassName?: string;
}

export const StatsSkeleton = ({
  count = 4,
  containerClassName = "admin-stats-grid",
  cardClassName = "admin-stat-card",
}: StatsSkeletonProps) => {
  return (
    <div className={containerClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          className={`${cardClassName} flex flex-col gap-2`}
          key={index}
        >
          <Skeleton variant="circle" width={44} height={44} />
          <Skeleton variant="text" width="55%" />
          <Skeleton variant="number" width="65%" height={32} />
        </div>
      ))}
    </div>
  );
};
