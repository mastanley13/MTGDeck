import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { analyzeDeck } from '../../utils/deckAnalytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Color constants for the charts
const CHART_COLORS = {
  W: 'rgb(248, 231, 185)', // White
  U: 'rgb(14, 104, 171)',  // Blue
  B: 'rgb(21, 11, 0)',     // Black
  R: 'rgb(211, 32, 42)',   // Red
  G: 'rgb(0, 115, 62)',    // Green
  Colorless: 'rgb(155, 155, 155)',
  // Card types
  Creature: 'rgb(224, 93, 38)',
  Instant: 'rgb(46, 117, 182)',
  Sorcery: 'rgb(192, 57, 43)',
  Artifact: 'rgb(189, 195, 199)',
  Enchantment: 'rgb(155, 89, 182)',
  Planeswalker: 'rgb(243, 156, 18)',
  Land: 'rgb(39, 174, 96)',
  Other: 'rgb(127, 140, 141)',
};

const ManaCurveChart = ({ manaCurve }) => {
  const labels = Object.keys(manaCurve).map(cmc => cmc === '7' ? '7+' : cmc);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Number of Cards',
        data: Object.values(manaCurve),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mana Curve',
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

const ColorDistributionChart = ({ colorDistribution }) => {
  // Remove colors with 0 cards
  const filteredColors = {};
  Object.entries(colorDistribution).forEach(([color, count]) => {
    if (count > 0) {
      filteredColors[color] = count;
    }
  });

  const data = {
    labels: Object.keys(filteredColors).map(color => {
      const colorNames = {
        W: 'White',
        U: 'Blue',
        B: 'Black',
        R: 'Red',
        G: 'Green',
        Colorless: 'Colorless'
      };
      return colorNames[color] || color;
    }),
    datasets: [
      {
        data: Object.values(filteredColors),
        backgroundColor: Object.keys(filteredColors).map(color => CHART_COLORS[color] || '#777777'),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Color Distribution',
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  );
};

const CardTypeChart = ({ typeBreakdown }) => {
  // Remove types with 0 cards
  const filteredTypes = {};
  Object.entries(typeBreakdown).forEach(([type, count]) => {
    if (count > 0) {
      filteredTypes[type] = count;
    }
  });

  const data = {
    labels: Object.keys(filteredTypes),
    datasets: [
      {
        data: Object.values(filteredTypes),
        backgroundColor: Object.keys(filteredTypes).map(type => CHART_COLORS[type] || '#777777'),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Card Type Breakdown',
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  );
};

const DeckAnalytics = ({ deck }) => {
  if (!deck || !deck.cards || deck.cards.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Deck Analytics</h2>
        <p className="text-gray-500">No cards in the deck to analyze.</p>
      </div>
    );
  }

  const analysis = analyzeDeck(deck);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Deck Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">Total Cards</div>
          <div className="text-2xl font-bold">{analysis.totalCards}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">Commander</div>
          <div className="text-lg font-bold truncate">{analysis.commander}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">Average CMC</div>
          <div className="text-2xl font-bold">{analysis.averageCMC}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-500">Card Types</div>
          <div className="text-lg font-bold">{Object.keys(analysis.typeBreakdown).filter(type => analysis.typeBreakdown[type] > 0).length} Types</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        <div className="bg-gray-50 p-4 rounded">
          <ManaCurveChart manaCurve={analysis.manaCurve} />
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <ColorDistributionChart colorDistribution={analysis.colorDistribution} />
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <CardTypeChart typeBreakdown={analysis.typeBreakdown} />
        </div>
      </div>
    </div>
  );
};

export default DeckAnalytics; 