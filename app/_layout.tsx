import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const client = new QueryClient();
export default function RootLayout() { return <QueryClientProvider client={client}><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></QueryClientProvider>; }
