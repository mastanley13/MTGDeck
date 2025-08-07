import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const Seo = ({
  title,
  description
}: {
  title: string;
  description?: string;
}) => {
  const { pathname } = useLocation();

  // Normalize path: lowercase, no trailing slash (except root)
  const normalizedPath = pathname === '/'
    ? ''
    : pathname.replace(/\/+$/, '').toLowerCase();
  const canonical = `https://aidecktutor.com${normalizedPath}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {/* Keep social URL in sync with canonical */}
      <meta property="og:url" content={canonical} />
      <meta name="robots" content="index,follow" />
    </Helmet>
  );
};