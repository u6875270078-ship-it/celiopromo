import React from 'react';

const JumboHeadline: React.FC = () => {
  return (
    <section className="jumbo" aria-labelledby="jumbo-title">
      <h2 id="jumbo-title">
        <span>reste</span>{' '}
        <b>
          toi‑même
          <span className="asterisk" aria-hidden="true">*</span>
        </b>
        .
      </h2>
    </section>
  );
};

export default JumboHeadline;