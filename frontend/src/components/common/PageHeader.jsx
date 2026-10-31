import React, { useEffect } from 'react';
import { useHeader } from '../../contexts/HeaderContext';

/**
 * Standard PageHeader component.
 * In the unified architecture, PageHeader seamlessly routes the page's title,
 * subtitle, and actions into the sticky Top Navigation Bar (matching AdminHeader in the Founder Console).
 * This eliminates the redundant second header inside the content body.
 */
export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge
}) => {
  const { setHeader, resetHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title,
      subtitle,
      actions: (badge || actions) ? (
        <>
          {badge}
          {actions}
        </>
      ) : null
    });
    return () => {
      resetHeader();
    };
  }, [title, subtitle, actions, badge, setHeader, resetHeader]);

  return null;
};

export default PageHeader;
