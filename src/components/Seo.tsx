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
  const canonical = `https://aidecktutor.com${pathname}`; // auto non-trailing slash

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
}; 