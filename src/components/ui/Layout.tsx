import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 flex flex-col">
      <nav className="bg-logoScheme-darkGray text-logoScheme-gold p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">MTG Commander Deck Builder</div>
          <div className="space-x-4 text-gray-200">
            <Link to="/" className="hover:text-logoScheme-gold hover:underline">Home</Link>
            <Link to="/deckbuilder" className="hover:text-logoScheme-gold hover:underline">Deck Builder</Link>
            <Link to="/decks" className="hover:text-logoScheme-gold hover:underline">My Decks</Link>
            <Link to="/about" className="hover:text-logoScheme-gold hover:underline">About</Link>
          </div>
        </div>
      </nav>
      
      <main className="flex-grow py-8">
        {children}
      </main>
      
      <footer className="bg-logoScheme-darkGray text-gray-300 p-4 mt-auto">
        <div className="container mx-auto text-center">
          &copy; {new Date().getFullYear()} MTG Commander Deck Builder
        </div>
      </footer>
    </div>
  );
};

export default Layout; 