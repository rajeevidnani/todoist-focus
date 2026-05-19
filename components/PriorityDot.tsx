interface Props {
  priority: 1 | 2 | 3 | 4
}

const COLOR: Record<number, string> = {
  4: 'bg-red-500',
  3: 'bg-orange-400',
  2: 'bg-blue-400',
  1: 'bg-gray-500',
}

const LABEL: Record<number, string> = {
  4: 'P1',
  3: 'P2',
  2: 'P3',
  1: 'P4',
}

export default function PriorityDot({ priority }: Props) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLOR[priority]}`}
      title={LABEL[priority]}
    />
  )
}
