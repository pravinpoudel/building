# building annotation with three.js and tween.js

### Progress:

Astronaut 3D GLTF model rendered which need to be annotated: 

![Screenshot](screenshots/roman.png)

### Update
```diff
- original 42MB scanned model with 24MB texture <br>
      |
      |  
      |
     \|/ 
- 11MB compressed GLB model
```

this will be added to the pipeline when there will be functionality to upload your own model
```diff
+ Bravo !! 
```

## Video demo:

[![Watch the video](https://img.youtube.com/vi/twamMzWmlDs/default.jpg)](https://youtu.be/twamMzWmlDs)


## Things to avoid or take care:

### Origin of the Mesh:

Origin of the mesh is the one thing that should be taken care of.

Check in blender where is your model origin, for example the orgin of model in drawing_room folder is;

![image](https://user-images.githubusercontent.com/11494733/201652148-4eb4364a-eba5-4a4f-9a99-5104973b4832.png)

but we need floor physics model because we don't want anything to penetrate floor and we always assume floor should be at origin.

Since this floor is not at origin, adding plane at orgin will look like this:

![image](https://user-images.githubusercontent.com/11494733/201652912-418ce406-4e9c-44d6-9e26-ecd4286ad16e.png)


