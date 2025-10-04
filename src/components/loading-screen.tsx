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
      <h1 className="text-4xl font-bold text-amber-200 mb-6 font-jersey">Cafescript</h1>

      {/* Coffee machine animation (from Uiverse.io by AnnixArt) */}
      <div className="container mb-6">
        <div className="coffee-header">
          <div className="coffee-header__buttons coffee-header__button-one"></div>
          <div className="coffee-header__buttons coffee-header__button-two"></div>
          <div
            className="coffee-header__display"
            style={{ ["--p" as any]: `${loadingProgress}%` }}
          ></div>
          <div className="coffee-header__details"></div>
        </div>
        <div className="coffee-medium">
          <div className="coffe-medium__exit"></div>
          <div className="coffee-medium__arm"></div>
          <div
            className="coffee-medium__liquid"
            style={{
              height: `${Math.round((loadingProgress / 100) * 62)}px`,
              opacity: loadingProgress > 0 ? 1 : 0,
            }}
          ></div>
          <div
            className="coffee-medium__smoke coffee-medium__smoke-one"
            style={{ animationPlayState: loadingProgress >= 25 ? "running" : "paused" }}
          ></div>
          <div
            className="coffee-medium__smoke coffee-medium__smoke-two"
            style={{ animationPlayState: loadingProgress >= 50 ? "running" : "paused" }}
          ></div>
          <div
            className="coffee-medium__smoke coffee-medium__smoke-three"
            style={{ animationPlayState: loadingProgress >= 75 ? "running" : "paused" }}
          ></div>
          <div
            className="coffee-medium__smoke coffee-medium__smoke-for"
            style={{ animationPlayState: loadingProgress >= 90 ? "running" : "paused" }}
          ></div>
          <div className="coffee-medium__cup"></div>
        </div>
        <div className="coffee-footer"></div>
      </div>

      {/* Porcentaje y mensaje */}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white drop-shadow-lg font-jersey">
          {Math.round(loadingProgress)}%
        </span>
        <p className="text-amber-200 text-lg mt-1 font-jersey">{getMessage()}</p>
      </div>

      <style jsx>{`
        /* From Uiverse.io by AnnixArt */
        .container {
          width: 300px;
          height: 280px;
          position: relative;
        }
        .coffee-header {
          width: 100%;
          height: 80px;
          position: absolute;
          top: 0;
          left: 0;
          background-color: #ddcfcc;
          border-radius: 10px;
        }
        .coffee-header__buttons {
          width: 25px;
          height: 25px;
          position: absolute;
          top: 25px;
          background-color: #282323;
          border-radius: 50%;
        }
        .coffee-header__buttons::after {
          content: "";
          width: 8px;
          height: 8px;
          position: absolute;
          bottom: -8px;
          left: calc(50% - 4px);
          background-color: #615e5e;
        }
        .coffee-header__button-one {
          left: 15px;
        }
        .coffee-header__button-two {
          left: 50px;
        }
        .coffee-header__display {
          width: 50px;
          height: 50px;
          position: absolute;
          top: calc(50% - 25px);
          left: calc(50% - 25px);
          border-radius: 50%;
          /* Progress ring using conic-gradient; --p set inline from JSX */
          background: conic-gradient(#43beae var(--p), #9acfc5 0);
          border: 5px solid #43beae;
          box-sizing: border-box;
        }
        .coffee-header__details {
          width: 8px;
          height: 20px;
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #9b9091;
          box-shadow: -12px 0 0 #9b9091, -24px 0 0 #9b9091;
        }
        .coffee-medium {
          width: 90%;
          height: 160px;
          position: absolute;
          top: 80px;
          left: calc(50% - 45%);
          background-color: #bcb0af;
        }
        .coffee-medium:before {
          content: "";
          width: 90%;
          height: 100px;
          background-color: #776f6e;
          position: absolute;
          bottom: 0;
          left: calc(50% - 45%);
          border-radius: 20px 20px 0 0;
        }
        .coffe-medium__exit {
          width: 60px;
          height: 20px;
          position: absolute;
          top: 0;
          left: calc(50% - 30px);
          background-color: #231f20;
        }
        .coffe-medium__exit::before {
          content: "";
          width: 50px;
          height: 20px;
          border-radius: 0 0 50% 50%;
          position: absolute;
          bottom: -20px;
          left: calc(50% - 25px);
          background-color: #231f20;
        }
        .coffe-medium__exit::after {
          content: "";
          width: 10px;
          height: 10px;
          position: absolute;
          bottom: -30px;
          left: calc(50% - 5px);
          background-color: #231f20;
        }
        .coffee-medium__arm {
          width: 70px;
          height: 20px;
          position: absolute;
          top: 15px;
          right: 25px;
          background-color: #231f20;
        }
        .coffee-medium__arm::before {
          content: "";
          width: 15px;
          height: 5px;
          position: absolute;
          top: 7px;
          left: -15px;
          background-color: #9e9495;
        }
        .coffee-medium__cup {
          width: 80px;
          height: 47px;
          position: absolute;
          bottom: 0;
          left: calc(50% - 40px);
          background-color: #fff;
          border-radius: 0 0 70px 70px / 0 0 110px 110px;
        }
        .coffee-medium__cup::after {
          content: "";
          width: 20px;
          height: 20px;
          position: absolute;
          top: 6px;
          right: -13px;
          border: 5px solid #fff;
          border-radius: 50%;
        }
        @keyframes liquid {
          0% {
            height: 0px;
            opacity: 1;
          }
          5% {
            height: 0px;
            opacity: 1;
          }
          20% {
            height: 62px;
            opacity: 1;
          }
          95% {
            height: 62px;
            opacity: 1;
          }
          100% {
            height: 62px;
            opacity: 0;
          }
        }
        .coffee-medium__liquid {
          width: 6px;
          /* Height controlled inline via progress */
          opacity: 0;
          position: absolute;
          top: 50px;
          left: calc(50% - 3px);
          background-color: #74372b;
          transition: height 400ms ease, opacity 200ms ease;
        }
        .coffee-medium__smoke {
          width: 8px;
          height: 20px;
          position: absolute;
          border-radius: 5px;
          background-color: #b3aeae;
        }
        @keyframes smokeOne {
          0% {
            bottom: 20px;
            opacity: 0;
          }
          40% {
            bottom: 50px;
            opacity: 0.5;
          }
          80% {
            bottom: 80px;
            opacity: 0.3;
          }
          100% {
            bottom: 80px;
            opacity: 0;
          }
        }
        @keyframes smokeTwo {
          0% {
            bottom: 40px;
            opacity: 0;
          }
          40% {
            bottom: 70px;
            opacity: 0.5;
          }
          80% {
            bottom: 80px;
            opacity: 0.3;
          }
          100% {
            bottom: 80px;
            opacity: 0;
          }
        }
        .coffee-medium__smoke-one {
          opacity: 0;
          bottom: 50px;
          left: 102px;
          animation: smokeOne 3s 4s linear infinite;
        }
        .coffee-medium__smoke-two {
          opacity: 0;
          bottom: 70px;
          left: 118px;
          animation: smokeTwo 3s 5s linear infinite;
        }
        .coffee-medium__smoke-three {
          opacity: 0;
          bottom: 65px;
          right: 118px;
          animation: smokeTwo 3s 6s linear infinite;
        }
        .coffee-medium__smoke-for {
          opacity: 0;
          bottom: 50px;
          right: 102px;
          animation: smokeOne 3s 5s linear infinite;
        }
        .coffee-footer {
          width: 95%;
          height: 15px;
          position: absolute;
          bottom: 25px;
          left: calc(50% - 47.5%);
          background-color: #41bdad;
          border-radius: 10px;
        }
        .coffee-footer::after {
          content: "";
          width: 106%;
          height: 26px;
          position: absolute;
          bottom: -25px;
          left: -8px;
          background-color: #000;
        }
      `}</style>
    </div>
  );
};
