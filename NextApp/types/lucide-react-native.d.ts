import 'lucide-react-native';

// react-native-svg 15.x убрал `color` и `strokeWidth` из SvgProps,
// но lucide-react-native поддерживает их в рантайме.
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
    strokeWidth?: string | number;
  }
}
