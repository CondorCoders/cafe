"use client";

interface LoadingScreenProps {
  loadingProgress: number;
}

export const LoadingScreen = ({ loadingProgress }: LoadingScreenProps) => {
  // Generar mensaje basado en el porcentaje
  const getMessage = () => {
    if (loadingProgress < 25) return "Iniciando...";
    if (loadingProgress < 50) return "Cargando recursos...";
    if (loadingProgress < 75) return "Preparando mundo virtual...";
    return "¡Casi listo!";
  };
  return (
    <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-amber-200 mb-8 font-jersey">
        Cafescript
      </h1>

      {/* Taza de café pixelada */}
      <div className="relative mb-6">
        {/* Vapor de la taza */}
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm animate-bounce">
          <div className="flex space-x-1">
            <span className="animate-pulse">~</span>
            <span className="animate-pulse delay-75">~</span>
            <span className="animate-pulse delay-150">~</span>
          </div>
        </div>

        {/* Taza principal */}
        <div className="relative">
          {/* Borde superior de la taza */}
          <div className="w-32 h-4 bg-gray-300 border-2 border-gray-800"></div>

          {/* Cuerpo de la taza */}
          <div className="relative w-28 h-20 mx-auto bg-gray-300 border-x-2 border-gray-800 overflow-hidden">
            {/* Café que se llena */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-900 to-amber-700 transition-all duration-500 ease-out"
              style={{
                height: `${loadingProgress}%`,
              }}
            >
              {/* Espuma del café */}
              {loadingProgress > 80 && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-amber-100 opacity-80"></div>
              )}
            </div>

            {/* Porcentaje en el centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white drop-shadow-lg font-jersey">
                {Math.round(loadingProgress)}%
              </span>
            </div>
          </div>

          {/* Base de la taza */}
          <div className="w-32 h-3 bg-gray-300 border-2 border-t-0 border-gray-800"></div>

          {/* Asa de la taza */}
          <div className="absolute right-0 top-4 w-6 h-16 border-4 border-gray-800 border-l-0 rounded-r-lg bg-transparent"></div>
        </div>
      </div>

      {/* Mensaje de carga */}
      <p className="text-amber-200 text-lg mb-2 font-jersey">{getMessage()}</p>
    </div>
  );
};
