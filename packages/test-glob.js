import {globby} from 'globby';

export const StyleFilePatterns = {
    include: [
      '**/*.css',
      '**/*.scss',
      '**/*.less',
      '**/*.sass'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ]
  };
  
  export const ComponentFilePatterns = {
    include: [
      '**/*.html',
      '**/*.cmp',
      '**/*.component',
      '**/*.app',
      '**/*.page',
      '**/*.interface'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ]
  }; 


async function getMatchedFile(directory) {
  return await globby(`${directory}`, {
    cwd: process.cwd(),
    expandDirectories:{
      extensions: ['css'],
    },
    ignore: ComponentFilePatterns.exclude,
    onlyFiles:true,
    absolute: true,
    dot: true, // Include .dot files
  })
}

getMatchedFile("./demo/**/enforce-bem.html").then((matches)=>{
    console.dir(matches);
})
