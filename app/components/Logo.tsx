import clsx from 'clsx'

type Props = {
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<Props> = ({ size = 'sm' }) => {
  return (
    <div
      className={clsx('flex tracking-wider group cursor-inherit rounded-sm border border-primary', {
        'p-1 text-sm font-semibold': size === 'sm',
        'p-2 text-lg font-bold': size === 'md',
        'p-4 text-2xl font-extrabold': size === 'lg',
      })}
    >
      <div
        className={clsx(
          'transition-all ease-in delay-75 duration-500 rounded-xs bg-primary text-primary-foreground group-hover:text-primary group-hover:bg-primary-foreground',
          {
            'p-1': size === 'sm',
            'p-2': size === 'md',
            'p-4': size === 'lg',
          },
        )}
      >
        SELLER
      </div>
      <div
        className={clsx(
          'transition-all ease-in delay-75 duration-500 rounded-xs group-hover:bg-primary group-hover:text-primary-foreground',
          {
            'p-1': size === 'sm',
            'p-2': size === 'md',
            'p-4': size === 'lg',
          },
        )}
      >
        WRITE
      </div>
    </div>
  )
}
