import { defineConfig } from 'vite';
import esbuild from 'esbuild';

// Plugin to transform h() calls with array children to individual arguments
// This must run before esbuild's JSX parser
const hArrayToArgsPlugin = {
  name: 'h-array-to-args',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
      return null;
    }
    try {
      // Transform h('tag', props, [child1, child2, ...]) to h('tag', props, child1, child2, ...)
      // This regex finds h() calls with array as third argument and expands them
      const transformed = code.replace(
        /h\(([^,]+),\s*([^,]+),\s*\[([^\]]*)\]\)/g,
        (match, tag, props, children) => {
          if (!children.trim()) return `h(${tag}, ${props})`;
          return `h(${tag}, ${props}, ${children})`;
        }
      );
      
      // Also handle nested arrays in children
      // This is a simplified version - for complex cases we'd need a proper AST transform
      
      return transformed;
    } catch (e) {
      return null;
    }
  },
};

export default defineConfig({
  plugins: [
    {
      name: 'h-array-to-args',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
          return null;
        }
        try {
          // Transform h('tag', props, [child1, child2, ...]) to h('tag', props, child1, child2, ...)
          // This regex finds h() calls with array as third argument and expands them
          // We need to be careful about nested brackets
          let result = code;
          
          // Simple transformation: h(tag, props, [a, b, c]) -> h(tag, props, a, b, c)
          // This is a naive regex that works for simple cases
          // For production, we'd use a proper AST parser
          const regex = /h\(([^,]+),\s*([^,]+),\s*\[([^\]]*)\]\)/g;
          result = result.replace(regex, (match, tag, props, children) => {
            if (!children.trim()) return `h(${tag}, ${props})`;
            return `h(${tag}, ${props}, ${children})`;
          });
          
          return { code: result, map: null };
        } catch (e) {
          return null;
        }
      },
    },
    // Preact runtime only
    {
      name: 'preact-runtime',
      configResolved(config) {
        config.optimizeDeps = config.optimizeDeps || {};
        config.optimizeDeps.include = config.optimizeDeps.include || [];
        config.optimizeDeps.include.push('preact', '@preact/signals');
      },
    },
  ],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet-vendor': ['leaflet', 'proj4', 'proj4leaflet'],
          'preact-vendor': ['preact', '@preact/signals'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  esbuild: {
    jsx: 'preserve',
  },
  optimizeDeps: {
    exclude: ['preact'],
  },
});