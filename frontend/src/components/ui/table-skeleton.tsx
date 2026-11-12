import Skeleton from "./skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  wrapperClassName?: string;
  tableClassName?: string;
};

export const TableSkeleton = ({
  rows = 5,
  columns = 6,
  wrapperClassName = "company-table-scroll",
  tableClassName = "company-table",
}: TableSkeletonProps) => {
  return (
    <div className={wrapperClassName}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <Skeleton variant="text" width="70%" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? "75%" : "60%"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
