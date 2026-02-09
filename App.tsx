
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, GridState, ShapeData, ScoreState, GameMode, DailyTask } from './types';
import { createEmptyGrid, generateShapeSet, canPlaceShape, placeShape, checkLines, calculatePoints, isAnyPlacementPossible } from './services/gameLogic';
import { Block } from './components/Block';
import { COLOR_MAP, GRID_SIZE } from './constants';
import { Trophy, Play, Pause, RotateCcw, Volume2, VolumeX, LogOut, Check, X, Settings, Moon, Sun, Languages, Zap, Clock, ShieldAlert, Award, Star, ChevronRight } from 'lucide-react';

type Language = 'en' | 'uk';
type Theme = 'dark' | 'light';

const TRANSLATIONS = {
  en: {
    score: 'Score',
    best: 'Best',
    play: 'PLAY',
    settings: 'SETTINGS',
    restartQ: 'RESTART?',
    yesRestart: 'YES, RESTART',
    continue: 'CONTINUE',
    finished: 'FINISHED',
    retry: 'RETRY',
    backToMenu: 'Menu',
    paused: 'PAUSED',
    resume: 'RESUME',
    exitGame: 'EXIT',
    theme: 'Theme',
    language: 'Language',
    done: 'DONE',
    level: 'LEVEL',
    classic: 'Classic',
    classicDesc: 'THE ORIGINAL ENDLESS MODE',
    timeRush: 'Time Rush',
    timeRushDesc: 'RACE AGAINST THE CLOCK',
    hard: 'Hard Mode',
    hardDesc: 'SMALL FIELD, TOUGH CHALLENGES',
    tasks: 'Daily Tasks',
    time: 'Time',
    gameSounds: 'Game Sounds',
    resetBest: 'Reset Best Score',
    personalBest: 'Personal Best',
    confirmReset: 'Clear your best score permanently?',
    selectMode: 'SELECT MODE'
  },
  uk: {
    score: 'Рахунок',
    best: 'Рекорд',
    play: 'ГРАТИ',
    settings: 'НАЛАШТУВАННЯ',
    restartQ: 'ЗАНОВО?',
    yesRestart: 'ТАК, ЗАНОВО',
    continue: 'ПРОДОВЖИТИ',
    finished: 'ФІНІШ',
    retry: 'ЩЕ РАЗ',
    backToMenu: 'Меню',
    paused: 'ПАУЗА',
    resume: 'ДАЛІ',
    exitGame: 'ВИХІД',
    theme: 'Тема',
    language: 'Мова',
    done: 'ГОТОВО',
    level: 'РІВЕНЬ',
    classic: 'Класика',
    classicDesc: 'ОРИГІНАЛЬНИЙ НЕСКІНЧЕННИЙ РЕЖИМ',
    timeRush: 'На час',
    timeRushDesc: 'ВСТИГНИ ЗА 60 СЕКУНД',
    hard: 'Важкий',
    hardDesc: 'МАЛЕ ПОЛЕ, СЕРЙОЗНІ ВИКЛИКИ',
    tasks: 'Завдання',
    time: 'Час',
    gameSounds: 'Звуки гри',
    resetBest: 'Скинути рекорд',
    personalBest: 'Особистий Рекорд',
    confirmReset: 'Видалити ваш рекорд назавжди?',
    selectMode: 'ОБЕРІТЬ РЕЖИМ'
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC);
  const [grid, setGrid] = useState<GridState>(createEmptyGrid());
  const [availableShapes, setAvailableShapes] = useState<(ShapeData | null)[]>([null, null, null]);
  const [score, setScore] = useState<ScoreState>({ current: 0, best: 0, combo: 1, xp: 0, level: 1, timeLeft: 0 });
  
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Language>('en');
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';

  const [draggingShape, setDraggingShape] = useState<{ shape: ShapeData, index: number } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [previewPlacement, setPreviewPlacement] = useState<{ row: number, col: number } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedBest = localStorage.getItem('lineCraftBest');
    const savedXp = localStorage.getItem('lineCraftXp');
    const savedLevel = localStorage.getItem('lineCraftLevel');
    const savedTheme = localStorage.getItem('lineCraftTheme') as Theme;
    const savedLang = localStorage.getItem('lineCraftLang') as Language;
    const savedMuted = localStorage.getItem('lineCraftMuted');

    if (savedBest) setScore(s => ({ ...s, best: parseInt(savedBest) }));
    if (savedXp) setScore(s => ({ ...s, xp: parseInt(savedXp) }));
    if (savedLevel) setScore(s => ({ ...s, level: parseInt(savedLevel) }));
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLang(savedLang);
    if (savedMuted) setMuted(savedMuted === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('lineCraftTheme', theme);
    localStorage.setItem('lineCraftLang', lang);
    localStorage.setItem('lineCraftMuted', muted.toString());
  }, [theme, lang, muted]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && gameMode === GameMode.TIME_RUSH) {
      timerRef.current = window.setInterval(() => {
        setScore(prev => {
          if ((prev.timeLeft ?? 0) <= 0) {
            setGameState(GameState.GAMEOVER);
            return prev;
          }
          return { ...prev, timeLeft: (prev.timeLeft ?? 0) - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, gameMode]);

  const handleLevelUp = (xp: number) => {
    const requiredXp = score.level * 200;
    if (xp >= requiredXp) {
      setScore(s => ({ ...s, level: s.level + 1, xp: xp - requiredXp }));
      localStorage.setItem('lineCraftLevel', (score.level + 1).toString());
    }
  };

  const startNewGame = useCallback((mode: GameMode = GameMode.CLASSIC) => {
    const size = mode === GameMode.HARD ? 7 : 8;
    const initialGrid = createEmptyGrid(size);
    setGrid(initialGrid);
    setGameMode(mode);
    setAvailableShapes(generateShapeSet(initialGrid));
    setScore(prev => ({ 
      ...prev, 
      current: 0, 
      combo: 1, 
      timeLeft: mode === GameMode.TIME_RUSH ? 60 : undefined 
    }));
    setGameState(GameState.PLAYING);
    setShowRestartConfirm(false);
    setShowModeSelector(false);
  }, []);

  const handlePointerDown = (e: React.PointerEvent, shape: ShapeData, index: number) => {
    if (gameState !== GameState.PLAYING) return;
    setDraggingShape({ shape, index });
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingShape) return;
    setDragPosition({ x: e.clientX, y: e.clientY });

    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const size = gameMode === GameMode.HARD ? 7 : 8;
      const cellSize = rect.width / size;
      const col = Math.round((e.clientX - rect.left - (cellSize * draggingShape.shape.matrix[0].length / 2)) / cellSize);
      const row = Math.round((e.clientY - rect.top - (cellSize * draggingShape.shape.matrix.length / 2)) / cellSize);
      if (canPlaceShape(grid, draggingShape.shape, row, col)) setPreviewPlacement({ row, col });
      else setPreviewPlacement(null);
    }
  };

  const handlePointerUp = () => {
    if (draggingShape && previewPlacement) {
      const { row, col } = previewPlacement;
      const { newGrid: gridAfterPlace } = placeShape(grid, draggingShape.shape, row, col);
      const { newGrid: finalGrid, linesCleared } = checkLines(gridAfterPlace);
      
      const newCombo = linesCleared > 0 ? score.combo + 1 : 1;
      const earned = calculatePoints(draggingShape.shape, linesCleared, newCombo);
      const newXp = score.xp + earned;

      if (score.current + earned > score.best) {
         localStorage.setItem('lineCraftBest', (score.current + earned).toString());
      }

      setGrid(finalGrid);
      setScore(s => ({ 
        ...s, 
        current: s.current + earned, 
        combo: newCombo, 
        xp: newXp,
        best: Math.max(s.best, s.current + earned)
      }));
      handleLevelUp(newXp);
      localStorage.setItem('lineCraftXp', newXp.toString());

      const nextShapes = [...availableShapes];
      nextShapes[draggingShape.index] = null;
      if (nextShapes.every(s => s === null)) {
        const batch = generateShapeSet(finalGrid);
        setAvailableShapes(batch);
        if (!isAnyPlacementPossible(finalGrid, batch)) setGameState(GameState.GAMEOVER);
      } else {
        setAvailableShapes(nextShapes);
        if (!isAnyPlacementPossible(finalGrid, nextShapes)) setGameState(GameState.GAMEOVER);
      }
    }
    setDraggingShape(null);
    setPreviewPlacement(null);
  };

  const bgColor = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const panelColor = isDark ? 'bg-slate-900' : 'bg-white';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className={`fixed inset-0 flex flex-col items-center ${bgColor} ${textColor} transition-colors font-jakarta overflow-hidden touch-none select-none`}>
      
      {/* HUD with XP Bar */}
      <header className="w-full max-w-md px-6 pt-6 flex flex-col gap-2 z-20">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest opacity-50">{t.score}</span>
            <span className="text-3xl font-black leading-none">{score.current}</span>
          </div>
          {gameMode === GameMode.TIME_RUSH && (
             <div className="bg-rose-500 text-white px-4 py-1 rounded-full flex items-center gap-2 font-black shadow-lg">
                <Clock size={16}/> {score.timeLeft}s
             </div>
          )}
          <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-black tracking-widest opacity-50">{t.level} {score.level}</span>
             <div className="w-24 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${(score.xp / (score.level * 200)) * 100}%` }} />
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md px-4 flex flex-col justify-center gap-4">
        <div 
          ref={gridRef}
          className={`relative aspect-square w-full ${panelColor} rounded-3xl p-1.5 border-[4px] ${borderColor} shadow-2xl transition-all`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className={`grid h-full w-full gap-1 ${gameMode === GameMode.HARD ? 'grid-cols-7 grid-rows-7' : 'grid-cols-8 grid-rows-8'}`}>
            {grid.map((rowArr, r) => rowArr.map((cell, c) => {
              const isPre = previewPlacement && draggingShape && 
                r >= previewPlacement.row && r < previewPlacement.row + draggingShape.shape.matrix.length &&
                c >= previewPlacement.col && c < previewPlacement.col + draggingShape.shape.matrix[0].length &&
                draggingShape.shape.matrix[r-previewPlacement.row][c-previewPlacement.col] === 1;
              return (
                <div key={`${r}-${c}`} className="relative w-full aspect-square">
                  <Block color={cell?.color ?? null} specialType={cell?.specialType} life={cell?.life} />
                  {isPre && <div className="absolute inset-0 bg-white/30 rounded-md animate-pulse" />}
                </div>
              );
            }))}
          </div>
        </div>

        <div className="flex justify-center gap-3 h-32">
          {availableShapes.map((shape, idx) => (
            <div key={idx} className={`flex-1 flex items-center justify-center ${panelColor} rounded-2xl border ${borderColor} relative overflow-hidden`}>
              {shape && (
                <div 
                  className={`cursor-grab active:cursor-grabbing transform transition-all duration-300 ${draggingShape?.index === idx ? 'opacity-0' : 'hover:scale-105 active:scale-90'}`}
                  onPointerDown={e => handlePointerDown(e, shape, idx)}
                  style={{ transform: shape.matrix.length > 3 || shape.matrix[0].length > 3 ? 'scale(0.5)' : 'scale(0.65)' }}
                >
                  <div className="flex flex-col gap-1">
                    {shape.matrix.map((row, r) => (
                      <div key={r} className="flex gap-1">
                        {row.map((val, c) => (
                          <div key={c} className="w-8 h-8">
                            {val === 1 && <Block color={shape.color} specialType={shape.specialBlocks?.find(sb => sb.r === r && sb.c === c)?.type} life={2} />}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="w-full max-w-md px-6 py-6 flex justify-around items-center z-10">
        <button onClick={() => setShowSettings(true)} className={`p-4 ${panelColor} rounded-2xl border ${borderColor} active:scale-90 transition-all`}>
           <Settings size={22} />
        </button>
        <button onClick={() => setGameState(GameState.PAUSED)} className={`p-4 ${panelColor} rounded-2xl border ${borderColor} active:scale-90 transition-all`}>
           <Pause size={22} />
        </button>
        <button onClick={() => setShowRestartConfirm(true)} className={`p-4 ${panelColor} rounded-2xl border ${borderColor} active:scale-90 transition-all`}>
           <RotateCcw size={22} />
        </button>
      </footer>

      {draggingShape && (
        <div 
          className="fixed pointer-events-none z-[100]" 
          style={{ left: dragPosition.x, top: dragPosition.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className="flex flex-col gap-1 opacity-90 drop-shadow-2xl">
            {draggingShape.shape.matrix.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((val, c) => (
                  <div key={c} className="w-10 h-10">
                    {val === 1 && <Block color={draggingShape.shape.color} specialType={draggingShape.shape.specialBlocks?.find(sb => sb.r === r && sb.c === c)?.type} life={2} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className={`fixed inset-0 ${bgColor} z-[500] flex flex-col items-center justify-center p-8 transition-all`}>
           <div className="text-center mb-16 animate-in zoom-in duration-700 flex flex-col items-center">
              <h1 className={`text-8xl font-black italic tracking-tighter leading-[0.85] ${isDark ? 'text-white' : 'text-slate-900'} uppercase`}>LINE</h1>
              <h1 className="text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-[#f43f5e] uppercase">CRAFT</h1>
           </div>
           
           <div className="flex flex-col gap-4 w-full max-w-[300px]">
              <button 
                onClick={() => setShowModeSelector(true)} 
                className="group relative w-full py-8 rounded-[2.5rem] bg-white text-slate-950 font-black text-4xl flex items-center justify-center gap-5 shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                <Play fill="currentColor" size={48} className="relative z-10" />
                <span className="relative z-10 tracking-tight">{t.play}</span>
              </button>

              <button 
                onClick={() => setShowSettings(true)} 
                className={`w-full py-5 rounded-3xl ${panelColor} ${isDark ? 'text-slate-300' : 'text-slate-600'} font-black text-xl flex items-center justify-center gap-4 border-2 ${borderColor} hover:bg-slate-800/10 active:scale-95 transition-all`}
              >
                <Settings size={24} /> {t.settings}
              </button>
           </div>
           
           <div className="mt-16 flex flex-col items-center opacity-60">
              <span className="text-[10px] font-black tracking-widest uppercase">{t.personalBest}</span>
              <span className="text-5xl font-black tabular-nums">{score.best}</span>
           </div>
        </div>
      )}

      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-slate-950/95 z-[600] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-200">
          <div className={`${panelColor} p-8 rounded-[3rem] border-2 ${borderColor} shadow-2xl w-full max-w-sm flex flex-col gap-6`}>
            <div className="flex justify-between items-center px-2">
              <h2 className="text-2xl font-black italic tracking-tight uppercase">{t.selectMode}</h2>
              <button onClick={() => setShowModeSelector(false)} className="p-3 bg-slate-800/30 rounded-full hover:bg-slate-800/60 transition-colors">
                <X size={24}/>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => startNewGame(GameMode.CLASSIC)} 
                className={`flex items-center gap-5 p-5 rounded-[2rem] ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'bg-slate-100 hover:bg-slate-200'} border ${borderColor} transition-all text-left active:scale-[0.97] group`}
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Play fill="currentColor" size={32} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-xl leading-tight tracking-tight">{t.classic}</span>
                  <span className="text-[10px] opacity-40 font-black uppercase tracking-[0.05em] leading-tight">{t.classicDesc}</span>
                </div>
                <ChevronRight className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => startNewGame(GameMode.TIME_RUSH)} 
                className={`flex items-center gap-5 p-5 rounded-[2rem] ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'bg-slate-100 hover:bg-slate-200'} border ${borderColor} transition-all text-left active:scale-[0.97] group`}
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Clock size={32} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-xl leading-tight tracking-tight">{t.timeRush}</span>
                  <span className="text-[10px] opacity-40 font-black uppercase tracking-[0.05em] leading-tight">{t.timeRushDesc}</span>
                </div>
                <ChevronRight className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => startNewGame(GameMode.HARD)} 
                className={`flex items-center gap-5 p-5 rounded-[2rem] ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'bg-slate-100 hover:bg-slate-200'} border ${borderColor} transition-all text-left active:scale-[0.97] group`}
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <ShieldAlert size={32} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-xl leading-tight tracking-tight">{t.hard}</span>
                  <span className="text-[10px] opacity-40 font-black uppercase tracking-[0.05em] leading-tight">{t.hardDesc}</span>
                </div>
                <ChevronRight className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === GameState.GAMEOVER && (
        <div className="fixed inset-0 bg-slate-950/95 z-[600] flex items-center justify-center p-6 backdrop-blur-xl">
           <div className={`${panelColor} p-10 rounded-[3rem] border ${borderColor} shadow-2xl flex flex-col items-center w-full max-sm text-center`}>
              <Award size={64} className="text-yellow-500 mb-4" />
              <h2 className="text-4xl font-black italic mb-2 uppercase">{t.finished}</h2>
              <div className="flex flex-col gap-1 mb-8">
                 <span className="text-5xl font-black leading-none">{score.current}</span>
                 <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Points</span>
              </div>
              <button onClick={() => startNewGame(gameMode)} className="w-full py-6 rounded-3xl bg-cyan-500 text-white font-black text-2xl shadow-lg active:scale-95 transition-all">
                {t.retry}
              </button>
              <button onClick={() => setGameState(GameState.MENU)} className="mt-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white py-2">
                {t.backToMenu}
              </button>
           </div>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/90 z-[700] flex items-center justify-center p-6 backdrop-blur-md">
           <div className={`${panelColor} p-8 rounded-[2.5rem] border ${borderColor} shadow-2xl w-full max-w-sm`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic">{t.settings}</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-800/20 rounded-full hover:bg-slate-800/40"><X size={20}/></button>
              </div>
              <div className="flex flex-col gap-4 mb-8">
                 <button onClick={() => setLang(lang === 'en' ? 'uk' : 'en')} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-3"><Languages size={20} className="text-purple-400"/> <span className="font-bold">{t.language}</span></div>
                    <span className="font-black text-cyan-500 uppercase">{lang}</span>
                 </button>
                 <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-3">{isDark ? <Moon size={20} className="text-blue-400"/> : <Sun size={20} className="text-orange-400"/>} <span className="font-bold">{t.theme}</span></div>
                    <span className="font-black text-cyan-500 uppercase">{theme}</span>
                 </button>
                 <button onClick={() => setMuted(!muted)} className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-3">{muted ? <VolumeX size={20} className="text-slate-500"/> : <Volume2 size={20} className="text-cyan-400"/>} <span className="font-bold">{t.gameSounds}</span></div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${muted ? 'bg-slate-700' : 'bg-cyan-500'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${muted ? 'left-1' : 'left-6'}`} /></div>
                 </button>
                 <button 
                  onClick={() => {
                    if (confirm(t.confirmReset)) {
                       localStorage.removeItem('lineCraftBest');
                       setScore(prev => ({ ...prev, best: 0 }));
                    }
                  }}
                  className="w-full bg-slate-800/20 text-rose-500/80 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-500/10 active:opacity-60"
                >
                  {t.resetBest}
                </button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-5 rounded-2xl bg-[#f43f5e] text-white font-black shadow-lg shadow-rose-950/20 hover:scale-[1.02] active:scale-95 transition-all">
                 {t.done}
              </button>
           </div>
        </div>
      )}

      {gameState === GameState.PAUSED && (
         <div className="fixed inset-0 bg-slate-950/80 z-[600] flex items-center justify-center p-8 backdrop-blur-sm">
            <div className={`${panelColor} p-10 rounded-[3rem] border ${borderColor} shadow-2xl flex flex-col items-center w-full max-w-xs`}>
               <h2 className="text-3xl font-black italic mb-10">{t.paused}</h2>
               <div className="flex flex-col w-full gap-4">
                  <button onClick={() => setGameState(GameState.PLAYING)} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black shadow-lg active:scale-95">{t.resume}</button>
                  <button onClick={() => setGameState(GameState.MENU)} className="w-full py-5 bg-slate-800 text-rose-500 rounded-2xl font-black border border-slate-700 active:scale-95">{t.exitGame}</button>
               </div>
            </div>
         </div>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 bg-slate-950/90 z-[700] flex items-center justify-center p-6 backdrop-blur-md">
           <div className={`${panelColor} p-8 rounded-[2.5rem] border ${borderColor} shadow-2xl flex flex-col items-center w-full max-w-xs text-center`}>
              <RotateCcw size={48} className="text-yellow-500 mb-6" />
              <h2 className="text-2xl font-black mb-2 italic">{t.restartQ}</h2>
              <div className="flex flex-col w-full gap-3 mt-6">
                 <button onClick={() => startNewGame(gameMode)} className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black shadow-lg active:scale-95">{t.yesRestart}</button>
                 <button onClick={() => setShowRestartConfirm(false)} className="w-full py-5 bg-slate-800 text-slate-300 rounded-2xl font-black active:scale-95">{t.continue}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
