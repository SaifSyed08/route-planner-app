import Papa from 'papaparse';
import { Coordinate } from '../types';

export interface CSVParseResult {
  success: boolean;
  coordinates: Coordinate[];
  error?: string;
}

export const parseCSVFile = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          const coordinates: Coordinate[] = [];

          // Validate we have the expected number of rows/columns
          if (data.length < 2) {
            resolve({
              success: false,
              coordinates: [],
              error: 'CSV must contain at least 2 rows (header + data)'
            });
            return;
          }

          // Skip header row if it exists
          const dataRows = data.slice(1);
          
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            if (row.length < 2) {
              continue; // Skip incomplete rows
            }

            const lat = parseFloat(row[0]);
            const lng = parseFloat(row[1]);

            if (isNaN(lat) || isNaN(lng)) {
              resolve({
                success: false,
                coordinates: [],
                error: `Invalid coordinates at row ${i + 2}: ${row[0]}, ${row[1]}`
              });
              return;
            }

            // Validate coordinate ranges
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              resolve({
                success: false,
                coordinates: [],
                error: `Coordinates out of range at row ${i + 2}: ${lat}, ${lng}`
              });
              return;
            }

            coordinates.push({
              id: `point_${i}`,
              lat,
              lng,
              type: 'original'
            });
          }

          if (coordinates.length !== 37) {
            resolve({
              success: false,
              coordinates: [],
              error: `Expected 37 coordinates, but found ${coordinates.length}. Please ensure your CSV contains a 6x6 grid (36 points) plus 1 center point.`
            });
            return;
          }

          // Mark the first coordinate as center (or you could implement logic to find the actual center)
          coordinates[0].isCenter = true;
          coordinates[0].type = 'center';

          resolve({
            success: true,
            coordinates
          });

        } catch (error) {
          resolve({
            success: false,
            coordinates: [],
            error: `Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          coordinates: [],
          error: `Failed to parse CSV file: ${error.message}`
        });
      }
    });
  });
};

export const validateCoordinates = (coordinates: Coordinate[]): { valid: boolean; error?: string } => {
  if (coordinates.length !== 37) {
    return {
      valid: false,
      error: `Expected 37 coordinates, got ${coordinates.length}`
    };
  }

  const centerPoints = coordinates.filter(c => c.isCenter || c.type === 'center');
  if (centerPoints.length !== 1) {
    return {
      valid: false,
      error: 'Exactly one center point is required'
    };
  }

  // Check for duplicate coordinates
  const coordStrings = coordinates.map(c => `${c.lat},${c.lng}`);
  const uniqueCoords = new Set(coordStrings);
  if (uniqueCoords.size !== coordinates.length) {
    return {
      valid: false,
      error: 'Duplicate coordinates detected'
    };
  }

  return { valid: true };
};