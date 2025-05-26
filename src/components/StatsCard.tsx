import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
}

export default function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      change.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {change.isPositive ? (
                      <ArrowUpIcon
                        className="self-center flex-shrink-0 h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowDownIcon
                        className="self-center flex-shrink-0 h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    )}
                    <span className="sr-only">
                      {change.isPositive ? 'Increased' : 'Decreased'} by
                    </span>
                    {change.value}
                    <span className="sr-only">, {change.label}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className="text-gray-500">{change.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
