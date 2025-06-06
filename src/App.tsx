/// <reference types="node" />
import { useState, useEffect } from 'react';
import './App.css';
import ResponsiveFretboard from './components/core/ResponsiveFretboard';
import { NoteData } from './components/core/NoteMarkers';
import { generateAllFretboardNotes, getNoteAtPosition } from './components/core/FretboardUtils';
import Layout from './components/layout/Layout';
import Button from './components/ui/Button';
import Select from './components/ui/Select';
import StringSelection from './components/ui/StringSelection';
import { updateTitle } from './utils/SEOUtils';
import ReactGA from 'react-ga4';
import emailjs from 'emailjs-com';

function App() {
  // Initialize Google Analytics and EmailJS on app load
  useEffect(() => {
    // Initialize Google Analytics
    ReactGA.initialize('G-D37FBTN3TP');
    ReactGA.send({ hitType: 'pageview', page: '/' });

    // Initialize EmailJS
    emailjs.init('WR3raC70Oqwd00JG8');
  }, []);

  // Game settings state
  const [fretLength, setFretLength] = useState(12);
  const [startString, setStartString] = useState(6); // Default to 6th string (low E)
  const [endString, setEndString] = useState(1);   // Default to 1st string (high E)
  const [isMobile, setIsMobile] = useState(false);

  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [targetNote, setTargetNote] = useState<NoteData | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timer
  const [timerActive, setTimerActive] = useState(false);
  const [guessResult, setGuessResult] = useState<boolean | null>(null);

  // Define number of frets to show
  const numberOfFrets = fretLength;

  // Detect if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Update title based on game state
  useEffect(() => {
    if (gameActive) {
      updateTitle('Playing Note Recognition Game');
    } else if (gameEnded) {
      updateTitle(`Game Results: Score ${score}`);
    } else {
      updateTitle('Master the Guitar Fretboard');
    }
  }, [gameActive, gameEnded, score]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (gameActive && timerActive) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval as NodeJS.Timeout);
            setTimerActive(false);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!timerActive) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameActive, timerActive]);

  // Generate a random target note
  const generateRandomNote = () => {
    const stringNumber = Math.floor(
      Math.random() * (startString - endString + 1) + endString
    );
    const fretNumber = Math.floor(Math.random() * fretLength) + 1;
    const noteName = getNoteAtPosition(stringNumber, fretNumber);

    return {
      stringNumber,
      fretNumber,
      label: "?",
      actualNote: noteName,
      color: '#ff1493'
    };
  };

  // Start a new game
  const handleStartGame = () => {
    setGameActive(true);
    setGameEnded(false);
    setScore(0);
    setTimeLeft(60);
    setTimerActive(true);
    setGuessResult(null);
    setTargetNote(generateRandomNote());
  };

  // End the current game
  const endGame = () => {
    setGameActive(false);
    setTimerActive(false);
    setGameEnded(true);
    setTargetNote(null);
  };

  // Handle the manual end game button
  const handleEndGame = () => {
    endGame();
  };

  // Reset to original state
  const handleReset = () => {
    setGameEnded(false);
    setTargetNote(null);
  };

  // Handle user's note guess
  const handleNoteGuess = (guessedNote: string) => {
    if (!targetNote || !targetNote.actualNote) return;

    const isCorrect = guessedNote === targetNote.actualNote;

    if (isCorrect) {
      setGuessResult(true);
      setScore(score + 1);
      setTargetNote({ ...targetNote, label: "✓", color: "#22c55e" });

      setTimeout(() => {
        setTargetNote(generateRandomNote());
        setGuessResult(null);
      }, 1000);
    } else {
      setGuessResult(false);
      setTargetNote({ ...targetNote, label: "✗", color: "#ef4444" });

      setTimeout(() => {
        setTargetNote({ ...targetNote, label: "?", color: "#ff1493" });
        setGuessResult(null);
      }, 1000);
    }
  };

  // Notes for display in the fretboard
  const displayNotes = gameActive
    ? targetNote ? [targetNote] : []
    : generateAllFretboardNotes(6, numberOfFrets, 1);

  // Use different fret length options based on mobile/desktop
  const fretLengthOptions = isMobile
    ? [
      { value: 5, label: '5 Frets' },
      { value: 7, label: '7 Frets' },
      { value: 9, label: '9 Frets' },
      { value: 12, label: '12 Frets' }
    ]
    : [
      { value: 5, label: '5 Frets' },
      { value: 7, label: '7 Frets' },
      { value: 9, label: '9 Frets' },
      { value: 12, label: '12 Frets' },
      { value: 15, label: '15 Frets' },
      { value: 24, label: '24 Frets' }
    ];

  // All possible notes for the note selector
  const allNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // String labels for the simplified mobile view
  const getStringName = (num: number) => {
    const labels = ['1st (high E)', '2nd (B)', '3rd (G)', '4th (D)', '5th (A)', '6th (low E)'];
    return labels[num - 1] || `${num}th`;
  };

  return (
    <Layout>
      {gameActive ? (
        <div className="game-view-container min-h-screen flex flex-col">
          <div className="pt-4 md:pt-16 px-4 flex-5 flex flex-col">
            <div className="game-status flex items-center justify-between p-2 bg-gray-100 rounded mt-1 mb-4 md:mb-0">
              <div className="flex items-center space-x-10">
                <div className="score">
                  <span className="font-bold">Score:</span> {score}
                </div>
                <div className="timer">
                  <span className="font-bold">Time:</span> {formatTime(timeLeft)}
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={handleEndGame}>
                End Game
              </Button>
            </div>
            <div className="fretboard-container flex-grow flex flex-col justify-center items-center mb-0 overflow-hidden">
              <ResponsiveFretboard
                numberOfFrets={numberOfFrets}
                notes={displayNotes}
                gameActive={gameActive}
                targetNote={targetNote}
                guessResult={guessResult}
                scale={isMobile ? 0.65 : 0.9}
              />
            </div>
            <div className="note-selector py-2 transform -translate-y-[50px] md:translate-y-0 bg-white border-t border-gray-200 mb-1">
              <h4 className="text-sm font-bold mb-1 text-center">Select the correct note:</h4>
              <div className="grid grid-cols-6 gap-1 px-1">
                {allNotes.map((note) => (
                  <button
                    key={note}
                    className="py-2 px-0 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-sm"
                    onClick={() => handleNoteGuess(note)}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-3 text-center">
              Guitar Fretboard Mastery - Interactive Trainer
            </h1>
            {!gameEnded && (
              <div className="hidden md:block">
                <p className="text-lg text-center mb-6">
                  Test your fretboard skills with the Guitar Note Recognition Game!
                  Boost memory, improve playing, and track progress. Perfect for all guitarists! Play now!
                </p>
                <h2 className="text-2xl font-bold text-center mt-8 mb-4">
                  Start Training Your Fretboard Skills
                </h2>
              </div>
            )}
            {gameEnded && (
              <div className="game-summary mb-6 p-4 bg-blue-50 rounded-lg text-center">
                <h2 className="text-xl font-bold mb-2">Game Over!</h2>
                <p className="text-lg mb-2">
                  Your final score: <span className="font-bold text-blue-600">{score}</span>
                </p>
                <Button variant="primary" size="md" onClick={handleReset} className="mt-2">
                  Reset Game
                </Button>
              </div>
            )}
            <div className="mb-4">
              <ResponsiveFretboard
                numberOfFrets={numberOfFrets}
                notes={displayNotes}
                onNoteClick={undefined}
                gameActive={false}
                targetNote={null}
                guessResult={null}
                scale={0.9}
              />
            </div>
            {!gameEnded && (
              <div className="relative">
                <div className="sm:hidden flex flex-col items-center">
                  <div className="w-full max-w-md mb-20">
                    <div className="flex justify-between items-center mb-2">
                      <div className="w-1/2 pr-1">
                        <label className="block text-sm font-medium mb-1">Fret Length</label>
                        <Select
                          id="fret-length"
                          options={fretLengthOptions}
                          value={fretLength}
                          onChange={(e) => setFretLength(Number(e.target.value))}
                        />
                      </div>
                      <div className="w-1/2 pl-1">
                        <label className="block text-sm font-medium mb-1">String Range</label>
                        <div className="text-sm bg-gray-100 py-2 px-3 rounded-md border border-gray-300">
                          {getStringName(startString)} → {getStringName(endString)}
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <StringSelection
                        startString={startString}
                        endString={endString}
                        onStartStringChange={setStartString}
                        onEndStringChange={setEndString}
                      />
                    </div>
                  </div>
                  <div className="fixed bottom-24 left-0 right-0 px-4 z-40 flex justify-center">
                    <button
                      onClick={handleStartGame}
                      className="w-full max-w-md bg-green-500 hover:bg-green-600 
                                 text-white font-bold py-3 px-4 rounded-md shadow-lg 
                                 flex items-center justify-center"
                    >
                      <span>Start Game</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
                  <div>
                    <label className="block mb-2 font-medium">Fret Length</label>
                    <Select
                      id="desktop-fret-length"
                      options={fretLengthOptions}
                      value={fretLength}
                      onChange={(e) => setFretLength(Number(e.target.value))}
                    />
                  </div>
                  <StringSelection
                    startString={startString}
                    endString={endString}
                    onStartStringChange={setStartString}
                    onEndStringChange={setEndString}
                  />
                  <Button
                    variant="success"
                    size="md"
                    onClick={handleStartGame}
                    className="mt-4 sm:mt-0 sm:ml-4"
                  >
                    Start Game
                  </Button>
                </div>
              </div>
            )}
            {!gameEnded && (
              <div className="md:hidden mt-8">
                <p className="text-base text-center">
                  Test your fretboard skills with the Guitar Note Recognition Game!
                  Boost memory, improve playing, and track progress. Perfect for all guitarists! Play now!
                </p>
              </div>
            )}
            {!gameEnded && !isMobile && (
              <div className="mt-16 max-w-3xl mx-auto bg-gray-50 p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold mb-4">How to Master the Guitar Fretboard</h2>
                <div className="space-y-4">
                  <p>
                    <strong>Step 1:</strong> Select your desired fret length and string range. Beginners may want to start with fewer frets and focus on strings 6-4.
                  </p>
                  <p>
                    <strong>Step 2:</strong> Start the game and identify the note shown on the fretboard by clicking the correct note name.
                  </p>
                  <p>
                    <strong>Step 3:</strong> Practice regularly to build your recognition speed. Try to beat your previous scores!
                  </p>
                  <p>
                    The ability to quickly recognize notes on the fretboard is essential for improvisation, songwriting, and overall guitar mastery. Regular practice with Fretszy will help develop this crucial skill.
                  </p>
                </div>
              </div>
            )}
            {!gameEnded && isMobile && (
              <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-2">How to Play</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Select fret length and strings</li>
                  <li>Start the game to see a highlighted note</li>
                  <li>Identify the correct note name</li>
                  <li>Practice daily to improve your skills</li>
                </ul>
              </div>
            )}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
              __html: `
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Fretszy",
                "description": "Interactive guitar fretboard trainer to help guitarists learn notes and master the fretboard",
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "Any",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "featureList": [
                  "Interactive fretboard visualization",
                  "Note recognition game",
                  "Customizable fretboard length",
                  "String selection options",
                  "Responsive design for mobile and desktop"
                ]
              }
            `}} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;