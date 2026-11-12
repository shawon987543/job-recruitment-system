import Skeleton from "./skeleton";

export const DetailSkeleton = () => {
    return (
        <div className="grid grid-cols-2 gap-4.5">
        {[1, 2, 3, 4].map((card) => (
          <div className="admin-detail-card" key={card}>
            <Skeleton variant="text" width="45%" height={18} />

            {[1, 2, 3, 4].map((row) => (
              <div className="admin-detail-row" key={row}>
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="text" width="20%" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
}