
import React from 'react';
import { APP_NAME } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-primary-700 text-white shadow-md py-4">
      <div className="container mx-auto px-4 flex items-center">
        <i className="fas fa-robot fa-2x mr-3"></i>
        <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
      </div>
    </header>
  );
};

export default Header;
