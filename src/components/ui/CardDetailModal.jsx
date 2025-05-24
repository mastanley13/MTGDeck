import React, { useState, useEffect, useCallback } from 'react';
import { parseManaSymbols } from '../../utils/manaSymbols';
import axios from 'axios'; // Import axios for API calls

const CardDetailModal = ({ card, onClose }) => {
  if (!card) return null;

  const [allArtworks, setAllArtworks] = useState([]);
  const [currentArtIndex, setCurrentArtIndex] = useState(0);
  const [artLoading, setArtLoading] = useState(false);
  const [currentFace, setCurrentFace] = useState(0);

  // Enhanced function to get all card face images
  const getAllCardFaceImages = (card) => {
    if (!card) return [];

    try {
      const faces = [];

      // Single-faced card with direct image_uris
      if (card.image_uris && !card.card_faces) {
        faces.push({
          name: card.name,
          imageUrl: card.image_uris.png || card.image_uris.large || card.image_uris.normal,
          uris: card.image_uris,
          faceIndex: 0
        });
      }
      // Multi-faced card
      else if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face, index) => {
          if (face.image_uris) {
            const imageUrl = face.image_uris.png || face.image_uris.large || face.image_uris.normal;
            if (imageUrl) {
              faces.push({
                name: face.name || `${card.name} (Face ${index + 1})`,
                imageUrl: imageUrl,
                uris: face.image_uris,
                faceIndex: index,
                oracle_text: face.oracle_text,
                mana_cost: face.mana_cost,
                type_line: face.type_line,
                power: face.power,
                toughness: face.toughness,
                loyalty: face.loyalty
              });
            }
          }
        });
      }

      return faces;
    } catch (error) {
      console.error('CardDetailModal: Error processing card face images:', error, card);
      return [];
    }
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  const toggleFace = () => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % cardFaces.length);
    }
  };

  const fetchArtworks = useCallback(async () => {
    if (!card || !card.oracle_id) {
      // For cards without oracle_id, use current face data if it's a double-faced card
      let initialArtUri;
      if (isDoubleFaced && currentFaceData) {
        initialArtUri = currentFaceData.imageUrl;
      } else {
        initialArtUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      }
      
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

      // For the initial card, use the current face if it's a double-faced card
      let initialCardFullImageUri;
      if (isDoubleFaced && currentFaceData) {
        initialCardFullImageUri = currentFaceData.imageUrl;
      } else {
        initialCardFullImageUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      }
      
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
        } else if (print.card_faces && print.card_faces.length > 0) {
          // For double-faced cards, try to match the current face we're viewing
          if (isDoubleFaced && currentFace < print.card_faces.length && print.card_faces[currentFace]?.image_uris) {
            artUri = print.card_faces[currentFace].image_uris.png || 
                     print.card_faces[currentFace].image_uris.large || 
                     print.card_faces[currentFace].image_uris.normal;
          } else if (print.card_faces[0]?.image_uris) {
            // Fallback to first face
            artUri = print.card_faces[0].image_uris.png || 
                     print.card_faces[0].image_uris.large || 
                     print.card_faces[0].image_uris.normal;
          }
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
  }, [card, allArtworks.length, isDoubleFaced, currentFace, currentFaceData]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  // Refetch artworks when face changes for double-faced cards
  useEffect(() => {
    if (isDoubleFaced) {
      fetchArtworks();
    }
  }, [currentFace, isDoubleFaced, fetchArtworks]);
  
  const currentArtwork = allArtworks[currentArtIndex] || {};
  // For double-faced cards, prioritize current face data, otherwise use artwork or card image
  const mainImageUrl = isDoubleFaced && currentFaceData 
    ? (currentArtwork.uri || currentFaceData.imageUrl)
    : (currentArtwork.uri || card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal);
  
  // Use current face data for card details if it's a double-faced card
  const displayCard = isDoubleFaced && currentFaceData ? {
    ...card,
    name: currentFaceData.name,
    oracle_text: currentFaceData.oracle_text || card.oracle_text,
    mana_cost: currentFaceData.mana_cost || card.mana_cost,
    type_line: currentFaceData.type_line || card.type_line,
    power: currentFaceData.power || card.power,
    toughness: currentFaceData.toughness || card.toughness,
    loyalty: currentFaceData.loyalty || card.loyalty
  } : card;
  
  const cardText = displayCard.oracle_text || displayCard.description;

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
          <div className="relative">
            {mainImageUrl ? (
              <img 
                src={mainImageUrl} 
                alt={`Art for ${displayCard.name} - ${currentArtwork.setName || card.set_name}`}
                className="rounded-md max-w-full max-h-[75vh] md:max-h-[85vh] object-contain shadow-xl border-2 border-gray-600"
              />
            ) : (
              <div className="w-full aspect-[5/7] bg-gray-700 flex items-center justify-center text-gray-400 rounded-lg border-2 border-gray-600">
                {artLoading ? 'Loading Art...' : 'No Image Available'}
              </div>
            )}
            
            {/* Double-faced card indicator on image */}
            {isDoubleFaced && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg z-10">
                DFC - Face {currentFace + 1}/{cardFaces.length}
              </div>
            )}
          </div>
          
          {/* Prominent Flip Button for Double-Faced Cards */}
          {isDoubleFaced && (
            <div className="mt-3 w-full flex justify-center">
              <button
                onClick={toggleFace}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 shadow-lg transition-all duration-200 transform hover:scale-105"
                title={`Flip to ${cardFaces[(currentFace + 1) % cardFaces.length]?.name || 'other side'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Flip to Face {(currentFace + 1) % cardFaces.length + 1}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {currentFace + 1}/{cardFaces.length}
                </span>
              </button>
            </div>
          )}
          
          {allArtworks.length > 1 && (
            <div className="mt-2 w-full flex justify-between items-center px-1 z-10">
              <button onClick={handlePrevArt} className="bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md">Prev Art</button>
              <p className="text-xs text-gray-400 mx-2 text-center">
                {currentArtIndex + 1} of {allArtworks.length}<br/>
                {isDoubleFaced && <span className="block text-yellow-400 font-semibold">{currentFaceData?.name}</span>}
                <span className="block truncate max-w-[120px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                <span className="block truncate max-w-[120px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
              </p>
              <button onClick={handleNextArt} className="bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md">Next Art</button>
            </div>
          )}
           {allArtworks.length === 1 && currentArtwork.setName && (
             <p className="text-xs text-gray-400 mt-2 text-center">
                {isDoubleFaced && <span className="block text-yellow-400 font-semibold truncate max-w-[180px]">{currentFaceData?.name}</span>}
                <span className="block truncate max-w-[180px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                <span className="block truncate max-w-[180px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
              </p>
           )}
        </div>

        {/* Card Info Section */} 
        <div className="md:w-[60%] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1 sm:pr-1.5 flex-grow">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 tracking-wide mb-0.5 sm:mb-1 pr-6">{displayCard.name}</h2>
          <div className="flex justify-between items-baseline mb-1 sm:mb-1.5">
            <span className="text-gray-300 text-sm sm:text-base">{displayCard.type_line || displayCard.type}</span>
            {displayCard.mana_cost && <span className="text-yellow-400 font-mono text-sm sm:text-base">{parseManaSymbols(displayCard.mana_cost)}</span>}
          </div>
          
          {cardText && (
            <div className="bg-gray-700 p-2 sm:p-3 rounded-md mb-1.5 sm:mb-2 text-xs sm:text-sm text-gray-200 leading-normal whitespace-pre-wrap border border-gray-600">
              {cardText.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">{parseManaSymbols(line)}</p>
              ))}
            </div>
          )}

          {(displayCard.flavor_text || card.flavor_text) && (
            <div className="italic text-2xs sm:text-xs text-gray-400 border-t border-gray-700 pt-1.5 mt-1.5 mb-1.5 sm:mb-2">
              {(displayCard.flavor_text || card.flavor_text).split('\n').map((line, index) => <p key={index} className="mb-0.5 last:mb-0">{line}</p>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0.5 text-2xs sm:text-xs mb-1.5 sm:mb-2 text-gray-300">
            {(displayCard.power || displayCard.toughness) && (<p><strong>P/T:</strong> {displayCard.power}/{displayCard.toughness}</p>)}
            {displayCard.loyalty && (<p><strong>Loyalty:</strong> {displayCard.loyalty}</p>)}
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