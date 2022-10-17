import { dataSource } from "../index";

interface Coordinates {
  lat?: number;
  long?: number;
}

export async function convertCoordToGeo(
  locationId: number,
  coordinates: Coordinates
) {
  const point = `POINT(${coordinates.long} ${coordinates.lat})`;
  await dataSource.query(
    `
      WITH subquery AS (
        SELECT ST_GeomFromText($1, 4326) as geom
      )
      UPDATE location
      SET "geoLocation" = subquery.geom
      FROM subquery
      WHERE id = $2;
    `,
    [point, locationId]
  );
}
