import React from 'react';
import { Typography } from '@mui/material';

const TitleContent = ({ content, anchorId }) => (
  <Typography
    id={anchorId}
    component={anchorId ? 'h2' : 'h5'}
    variant="h5"
    mb={'0.5rem'}
    sx={{
      fontSize: { xs: '1.1rem', sm: '1.5rem' },
      scrollMarginTop: anchorId ? '6rem' : undefined,
    }}
  >
    {content}
  </Typography>
);
export default TitleContent;
