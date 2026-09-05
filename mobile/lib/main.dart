import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const BhumiSatyaFieldApp());
}

class BhumiSatyaFieldApp extends StatelessWidget {
  const BhumiSatyaFieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BHUMI-SATYA Field Officer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF07090E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF0D9488),
          surface: Color(0xFF0F172A),
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
