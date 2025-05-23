import React, { useState, useEffect, useCallback } from 'react';
import { parseManaSymbols } from '../../utils/manaSymbols';
import axios from 'axios'; // Import axios for API calls

const CardDetailModal = ({ card, onClose }) => {
  if (!card) return null;

  const [allArtworks, setAllArtworks] = useState([]);
  const [currentArtIndex, setCurrentArtIndex] = useState(0);
  const [artLoading, setArtLoading] = useState(false);

  const fetchArtworks = useCallback(async () => {
    if (!card || !card.oracle_id) {
      const initialArtUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      if (initialArtUri) {
        setAllArtworks([{
          uri: initialArtUri,
          setName: card.set_name,
          artist: card.artist,
          collector_number: card.collector_number
        }]);
      }
      return;
    }

    setArtLoading(true);
    try {
      const response = await axios.get(`https://api.scryfall.com/cards/search?order=released&q=oracleid%3A${card.oracle_id}&unique=prints&include_extras=true`);
      const prints = response.data.data;
      
      const uniqueArtworks = [];
      const seenImageUris = new Set(); // Renamed from seenArtCropUris

      const initialCardFullImageUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      if (initialCardFullImageUri) {
        uniqueArtworks.push({
          uri: initialCardFullImageUri,
          setName: card.set_name,
          artist: card.artist,
          collector_number: card.collector_number
        });
        seenImageUris.add(initialCardFullImageUri);
      }

      prints.forEach(print => {
        let artUri = null;

        if (print.image_uris) {
          artUri = print.image_uris.png || print.image_uris.large || print.image_uris.normal;
        } else if (print.card_faces && print.card_faces[0]?.image_uris) {
          artUri = print.card_faces[0].image_uris.png || print.card_faces[0].image_uris.large || print.card_faces[0].image_uris.normal;
        }

        if (artUri && !seenImageUris.has(artUri)) {
          uniqueArtworks.push({
            uri: artUri,
            setName: print.set_name,
            artist: print.artist,
            collector_number: print.collector_number
          });
          seenImageUris.add(artUri);
        }
      });

      setAllArtworks(uniqueArtworks);
      const initialIndex = uniqueArtworks.findIndex(art => art.uri === initialCardFullImageUri);
      setCurrentArtIndex(initialIndex !== -1 ? initialIndex : 0);

    } catch (error) {
      console.error("Error fetching card artworks:", error);
      const fallbackArtUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      if (fallbackArtUri && allArtworks.length === 0) {
         setAllArtworks([{
          uri: fallbackArtUri,
          setName: card.set_name,
          artist: card.artist,
          collector_number: card.collector_number
        }]);
      }
    }
    setArtLoading(false);
  }, [card, allArtworks.length]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);
  
  const currentArtwork = allArtworks[currentArtIndex] || {};
  // Prioritize currentArtwork.uri, then fallback to card prop with new image type preference
  const mainImageUrl = currentArtwork.uri || card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
  const cardText = card.oracle_text || card.description;

  const formatsToShow = [
    { key: 'standard', name: 'Standard' }, { key: 'pioneer', name: 'Pioneer' },
    { key: 'modern', name: 'Modern' }, { key: 'legacy', name: 'Legacy' },
    { key: 'vintage', name: 'Vintage' }, { key: 'commander', name: 'Commander' },
    { key: 'duel', name: 'Duel Cmdr' }, { key: 'paupercommander', name: 'Pauper EDH'},
    { key: 'brawl', name: 'Brawl' }, { key: 'historic', name: 'Historic' },
    { key: 'pauper', name: 'Pauper' }, { key: 'penny', name: 'Penny' },
    { key: 'historicbrawl', name: 'Historic Brawl' }, { key: 'alchemy', name: 'Alchemy' },
    { key: 'explorer', name: 'Explorer' }, { key: 'predh', name: 'PreDH'}
  ];

  const getLegalityClass = (status) => {
    switch (status) {
      case 'legal': return 'text-green-400';
      case 'not_legal': return 'text-red-400';
      case 'banned': return 'text-red-500 font-semibold';
      case 'restricted': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  const PriceDisplay = ({ prices }) => {
    if (!prices) return null;
    const { usd, usd_foil, usd_etched, tix } = prices;
    if (!usd && !usd_foil && !usd_etched && !tix) return null;
    return (
      <div className="mt-2 pt-2 border-t border-gray-700">
        <h4 className="text-sm font-semibold mb-1 text-gray-100">Prices:</h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-300">
          {usd && <p>USD: <span className="font-semibold text-gray-100">${usd}</span></p>}
          {usd_foil && <p>Foil: <span className="font-semibold text-gray-100">${usd_foil}</span></p>}
          {usd_etched && <p>Etched: <span className="font-semibold text-gray-100">${usd_etched}</span></p>}
          {tix && <p>Tix: <span className="font-semibold text-gray-100">{tix}</span></p>}
        </div>
      </div>
    );
  };

  const handlePrevArt = () => setCurrentArtIndex(prev => (prev - 1 + allArtworks.length) % allArtworks.length);
  const handleNextArt = () => setCurrentArtIndex(prev => (prev + 1) % allArtworks.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-2 sm:p-4 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col md:flex-row gap-3 sm:gap-4 relative text-gray-200 border border-gray-700" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-yellow-400 transition-colors z-20 p-1 bg-gray-700 hover:bg-gray-600 rounded-full"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Card Image Section */} 
        <div className="md:w-[40%] flex-shrink-0 flex flex-col justify-center items-center relative">
          {mainImageUrl ? (
            <img 
              src={mainImageUrl} 
              alt={`Art for ${card.name} - ${currentArtwork.setName || card.set_name}`}
              className="rounded-md max-w-full max-h-[75vh] md:max-h-[85vh] object-contain shadow-xl border-2 border-gray-600"
            />
          ) : (
            <div className="w-full aspect-[5/7] bg-gray-700 flex items-center justify-center text-gray-400 rounded-lg border-2 border-gray-600">
              {artLoading ? 'Loading Art...' : 'No Image Available'}
            </div>
          )}
          {allArtworks.length > 1 && (
            <div className="mt-2 w-full flex justify-between items-center px-1 z-10">
              <button onClick={handlePrevArt} className="bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md">Prev Art</button>
              <p className="text-xs text-gray-400 mx-2 text-center">
                {currentArtIndex + 1} of {allArtworks.length}<br/>
                <span className="block truncate max-w-[120px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                <span className="block truncate max-w-[120px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
              </p>
              <button onClick={handleNextArt} className="bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md">Next Art</button>
            </div>
          )}
           {allArtworks.length === 1 && currentArtwork.setName && (
             <p className="text-xs text-gray-400 mt-2 text-center">
                <span className="block truncate max-w-[180px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                <span className="block truncate max-w-[180px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
              </p>
           )}
        </div>

        {/* Card Info Section */} 
        <div className="md:w-[60%] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1 sm:pr-1.5 flex-grow">
          <h2 className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 text-yellow-400 tracking-wide pr-6">{card.name}</h2>
          <div className="flex justify-between items-baseline mb-1 sm:mb-1.5">
            <span className="text-gray-300 text-sm sm:text-base">{card.type_line || card.type}</span>
            {card.mana_cost && <span className="text-yellow-400 font-mono text-sm sm:text-base">{parseManaSymbols(card.mana_cost)}</span>}
          </div>
          
          {cardText && (
            <div className="bg-gray-700 p-2 sm:p-3 rounded-md mb-1.5 sm:mb-2 text-xs sm:text-sm text-gray-200 leading-normal whitespace-pre-wrap border border-gray-600">
              {cardText.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">{parseManaSymbols(line)}</p>
              ))}
            </div>
          )}

          {card.flavor_text && (
            <div className="italic text-2xs sm:text-xs text-gray-400 border-t border-gray-700 pt-1.5 mt-1.5 mb-1.5 sm:mb-2">
              {card.flavor_text.split('\n').map((line, index) => <p key={index} className="mb-0.5 last:mb-0">{line}</p>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0.5 text-2xs sm:text-xs mb-1.5 sm:mb-2 text-gray-300">
            {(card.power || card.toughness) && (<p><strong>P/T:</strong> {card.power}/{card.toughness}</p>)}
            {card.loyalty && (<p><strong>Loyalty:</strong> {card.loyalty}</p>)}
            {card.rarity && (<p><strong>Rarity:</strong> <span className="capitalize">{card.rarity}</span></p>)}
            {/* Artist is now shown under the image with art navigation */}
          </div>
          
          {(card.edhrec_rank || card.game_changer) && (
            <div className="my-1 sm:my-1.5 py-1 sm:py-1.5 border-t border-b border-gray-700 text-2xs sm:text-xs">
              {card.edhrec_rank && (<p className="text-gray-300">EDHREC Rank: <span className="font-semibold text-gray-100">{card.edhrec_rank.toLocaleString()}</span></p>)}
              {card.game_changer && (<p className="text-green-400 font-semibold mt-0.5">★ Game Changer</p> )}
            </div>
          )}

          <PriceDisplay prices={card.prices} />

          {card.legalities && (
            <div className="mt-2 pt-2 border-t border-gray-700 flex-grow flex flex-col min-h-[80px]">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-gray-100">Format Legalities:</h4>
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0 text-2xs sm:text-xs flex-grow overflow-y-auto max-h-28 sm:max-h-32 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pr-0.5">
                {formatsToShow.sort((a,b) => a.name.localeCompare(b.name)).map(format => {
                  const status = card.legalities[format.key];
                  return (
                    <div key={format.key} className="flex justify-between items-center">
                      <span className="text-gray-300">{format.name}:</span>
                      <span className={`${getLegalityClass(status)} capitalize font-medium`}>{status ? status.replace('_', ' ') : '???'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-auto pt-2 space-x-3 text-center">
            {card.scryfall_uri && <a href={card.scryfall_uri} target="_blank" rel="noopener noreferrer" className="text-2xs sm:text-xs text-blue-400 hover:text-blue-300 underline">Scryfall</a>}
            {card.related_uris?.edhrec && <a href={card.related_uris.edhrec} target="_blank" rel="noopener noreferrer" className="text-2xs sm:text-xs text-purple-400 hover:text-purple-300 underline">EDHREC</a>}
          </div>

          <p className="text-2xs sm:text-xs text-gray-500 mt-1.5 text-center">
            Original Set: {card.set_name} ({card.set?.toUpperCase()}) — #{card.collector_number || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal; 