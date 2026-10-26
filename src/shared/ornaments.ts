export const ornamentIds=['heart','champagne','beer','cake','stars','none'] as const;
export type OrnamentId=typeof ornamentIds[number];
export const ornaments=[{id:'heart',name:'Cœur'},{id:'champagne',name:'Champagne'},{id:'beer',name:'Bières'},{id:'cake',name:'Gâteau'},{id:'stars',name:'Étoiles'},{id:'none',name:'Aucune'}] as const;
