/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AdSlotProps {
  slotId?: string;
  className?: string;
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'ad-slot-placeholder',
  className = '',
  label = 'Advertisement Container',
}) => {
  // Container is marked with data-ad-slot and hidden by default as requested,
  // or styled subtly if configured in dev mode.
  return (
    <div
      id={slotId}
      data-ad-slot={slotId}
      className={`ad-slot-container hidden ${className}`}
      aria-label={label}
      aria-hidden="true"
    >
      {/* Ready for Google AdSense <ins class="adsbygoogle" ...></ins> */}
    </div>
  );
};
