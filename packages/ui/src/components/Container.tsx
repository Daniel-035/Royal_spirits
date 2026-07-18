import type { HTMLAttributes } from 'react';

export type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className = '', children, ...props }: ContainerProps) {
  return (
    <div className={['mx-auto w-full max-w-container px-4 lg:px-10', className].join(' ')} {...props}>
      {children}
    </div>
  );
}
