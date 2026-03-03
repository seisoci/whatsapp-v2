'use client';
import {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';
import { TooltipProps } from 'recharts';
import { Text } from 'rizzui';
import cn from '../../utils/class-names';
import { addSpacesToCamelCase } from '../../utils/add-spaces-to-camel-case';
import { formatNumber } from '../../utils/format-number';

function isValidHexColor(colorCode: string) {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(colorCode);
}

export interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  prefix?: string;
  postfix?: string;
  className?: string;
  formattedNumber?: boolean;
}

export function CustomTooltip(props: CustomTooltipProps) {
  const {
    label,
    prefix,
    active,
    postfix,
    payload,
    className,
    formattedNumber,
  } = props as any;
  if (!active) return null;

  return (
    <div
      className={cn(
        'bg-gray-0 rounded-md border border-gray-300 shadow-2xl dark:bg-gray-100',
        className
      )}
    >
      <Text className="label font-lexend mb-0.5 block bg-gray-100 p-2 px-2.5 text-center text-xs font-semibold text-gray-600 capitalize dark:bg-gray-200/60 dark:text-gray-700">
        {label}
      </Text>
      <div className="px-3 py-1.5 text-xs">
        {payload?.map((item: any, index: number) => (
          <div
            key={item.dataKey + index}
            className="chart-tooltip-item flex items-center py-1.5"
          >
            <span
              className="me-1.5 h-2 w-2 rounded-full"
              style={{
                backgroundColor: isValidHexColor(item.fill)
                  ? item.fill === '#fff'
                    ? item.stroke
                    : item.fill
                  : item.stroke,
              }}
            />
            <Text>
              <Text as="span" className="capitalize">
                {addSpacesToCamelCase(item.dataKey)}:
              </Text>{' '}
              <Text
                as="span"
                className="font-medium text-gray-900 dark:text-gray-700"
              >
                {prefix && prefix}
                {formattedNumber ? formatNumber(item.value) : item.value}
                {postfix && postfix}
              </Text>
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
