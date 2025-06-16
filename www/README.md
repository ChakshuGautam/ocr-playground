# OCR Evaluation Dashboard

A modern web interface for viewing and editing CSV data from the OCR processing pipeline, built with Vite, React, TypeScript, and ShadCN UI.

## Features

- **CSV Editor**: Upload, view, and edit CSV files with OCR results
- **Evaluation Dashboard**: Visualize accuracy metrics and processing statistics
- **Image Viewer**: Browse processed images and their detailed evaluations
- **Interactive UI**: Modern interface with tables, charts, and detailed views

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Usage

1. **Upload CSV**: Use the CSV Editor tab to upload your `images.csv` file
2. **View Results**: Navigate to the Dashboard to see processing statistics
3. **Browse Images**: Use the Images tab to view individual image results
4. **Edit Data**: Click edit buttons to modify reference text or OCR outputs

## File Structure

- `src/components/CSVEditor.tsx` - CSV upload and editing interface
- `src/components/EvaluationDashboard.tsx` - Statistics and analytics dashboard
- `src/components/ImageViewer.tsx` - Image gallery and detailed evaluation viewer
- `src/types/index.ts` - TypeScript type definitions

## Technologies

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type safety
- **ShadCN UI** - Modern component library
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **PapaParse** - CSV parsing library
