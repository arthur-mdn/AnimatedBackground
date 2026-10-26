import {WeddingFoliage} from '../video/WeddingFoliage';
import {GardenPalette} from '../video/GardenPalette';
import {gardenPalette,type GardenPaletteId} from '../shared/garden';
export function WeddingSwatch({palette='ivoire'}:{palette?:GardenPaletteId}){
 const colors=gardenPalette(palette);
 return <GardenPalette palette={palette}><span className="swatch wedding-swatch" style={{background:colors.background}} aria-hidden="true"><WeddingFoliage compact/><span style={{color:colors.secondary}}>&amp;</span></span></GardenPalette>;
}
