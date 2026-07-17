import React, { useState } from "react";

const Landing = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>☰</button>

      {isOpen && <div>Hello</div>}
    </div>
  );
};

export default Landing;
