import clsx from "clsx";

export default function ModuleCardSkeleton() {
  return (
    <div
      className={clsx(
        "w-64 p-2 bg-card rounded-xl shadow-md overflow-hidden flex flex-col",
        "transition-all duration-300 border border-[rgba(0,255,136,0.3)] shadow-2xl animate-pulse"
      )}
    >
      <div className="bg-muted rounded-xl h-48 w-full mb-3" />
      <div className="bg-muted rounded h-4 w-3/4 mx-auto" />
    </div>
  );
}
