/**
 * ErrorBoundary — wraps every 3D <Canvas /> to catch WebGL / render errors.
 */
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || "Unknown render fault." };
  }

  componentDidCatch(err, info) {
    console.error("[◈ Bio-Electric Labs] 3D pipeline fault:", err, info.componentStack);
  }

  handleRetry = () => this.setState({ hasError: false, message: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="relative glass-panel p-8 max-w-sm text-center rounded-sm">
          {/* corner brackets */}
          <div className="absolute top-0 left-0  w-3 h-3 border-t border-l border-red-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/40" />

          <p className="text-[9px] tracking-[0.35em] text-red-500/50 uppercase mb-3">
            ◈ Render Error
          </p>
          <h2 className="text-base font-bold text-red-400 mb-2">
            3D Pipeline Fault
          </h2>
          <p className="text-[10px] font-mono text-white/30 leading-relaxed mb-5">
            {this.state.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="glass-panel px-6 py-2 border border-red-500/20 text-red-400
                       text-[10px] tracking-widest uppercase
                       hover:bg-red-500/10 transition-colors duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
