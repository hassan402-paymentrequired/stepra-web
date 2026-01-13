import { FC } from 'react';
import { Link } from '@/components/ui';
import { LogoProps } from './types';

const Logo: FC<LogoProps> = ({ to = '#', variant = 'logo', ...props }) => {
  let logoUrl = '/logo.png';

  if (variant === 'logomark') logoUrl = '/logomark.png';

  const { height: h = 45, width: w = 170, ...linkProps } = props;

  return (
    <Link to={to} {...linkProps} className={`inline-block ${props.className}`}>
      <img src={logoUrl} alt="Logo" height={h} width={w} />
    </Link>
  );
};

export default Logo;
