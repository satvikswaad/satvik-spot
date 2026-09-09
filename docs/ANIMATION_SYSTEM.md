# Satvik Swaad ? Animation System

## 1. Keyframe Definitions
All animations use pure CSS keyframes defined in `public/site/style.css`:

```css
@keyframes ss-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ss-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes ss-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes ss-sway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
```

## 2. Utility Class Bindings
- `.animate-fade-up`: `animation: ss-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;`
- `.animate-fade-in`: `animation: ss-fade-in 0.9s ease both;`
- `.animate-float`: `animation: ss-float 6s ease-in-out infinite;` (used on the floating pickle jar)
- `.leaf-sway`: `transform-origin: bottom center; animation: ss-sway 7s ease-in-out infinite;`

## 3. Accessibility & Reduced Motion
In strict compliance with accessibility standards, all decorative and looped animations are completely deactivated when the user requests reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-fade-in,
  .animate-float,
  .leaf-sway {
    animation: none !important;
    transform: none !important;
  }
}
```
