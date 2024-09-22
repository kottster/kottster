#!/bin/bash

cd packages

for dir in */ ; do
    dir=${dir%*/}
    
    if [ -f "$dir/package.json" ]; then
        echo "Installing packages for $dir"
        
        cd "$dir"
        
        yarn install
        
        cd ..
        
        echo "Finished installing packages for $dir"
        echo "----------------------------------------"
    fi
done

echo "Done"