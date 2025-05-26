import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: React.ComponentType<{ className?: string }>;
}

export default function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
            {change && (
              <div
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.isPositive ? (
                  <ArrowUpIcon className="h-5 w-5 flex-shrink-0 self-center text-green-500" aria-hidden="true" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 flex-shrink-0 self-center text-red-500" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {change.isPositive ? 'Increased' : 'Decreased'} by
                </span>
                {change.value}
                <span className="ml-1 text-sm font-medium text-gray-500">
                  {change.label}
                </span>
              </div>
            )}
          </dd>
        </div>
      </div>
    </div>
  );
}
