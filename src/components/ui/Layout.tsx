import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">MTG Commander Deck Builder</div>
          <div className="space-x-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/deckbuilder" className="hover:underline">Deck Builder</Link>
            <Link to="/decks" className="hover:underline">My Decks</Link>
            <Link to="/about" className="hover:underline">About</Link>
          </div>
        </div>
      </nav>
      
      <main className="flex-grow py-8">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          &copy; {new Date().getFullYear()} MTG Commander Deck Builder
        </div>
      </footer>
    </div>
  );
};

export default Layout; 