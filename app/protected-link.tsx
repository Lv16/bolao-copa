import Link, { type LinkProps } from 'next/link';

type ProtectedLinkProps = LinkProps & {
  className?: string;
  children: React.ReactNode;
};

export function ProtectedLink({
  children,
  className,
  ...props
}: ProtectedLinkProps) {
  return (
    <Link {...props} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
