import React, { useEffect, useState } from 'react';
import "./App.css";
import { listImages } from './graphql/queries';
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/api";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import { Card, CardMedia, CardHeader, Typography, CardActions, CardContent, Modal, Box, TextField } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IconButton from '@mui/material/IconButton';
import { createImage, updateImage } from './graphql/mutations';
import uniqueId from 'lodash/uniqueId';
import { uploadData, getUrl } from 'aws-amplify/storage';

Amplify.configure(awsExports);
const client = generateClient();

export default function App() {
  const [imageList, setImageList] = useState([])
  const [imgData, setImgData] = useState({})
  const [imgFile, setImgFile] = useState()
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    getImageList();
  }, [])

  const getImageList = async () => {
    try {
      const imageData = await client.graphql({ query: listImages });
      const imageDataList = imageData.data.listImages.items;
      setImageList(imageDataList);
    }
    catch (error) {
      console.log('Error on fetching songs', error);
    }
  }

  const addFavorites = async (idx) => {
    try {
      const img = imageList[idx];
      img.likes = img.likes + 1;
      img.updatedAt = new Date().toISOString();

      const imageData = await client.graphql({
        query: updateImage,
        variables: { input: img },
      });

      const imageDataList = [...imageList]
      imageDataList[idx] = imageData.data.updateImage
      setImageList(imageDataList)
    }
    catch (error) {
      console.log('Error on fetching songs', error);
    }
  }

  const handleUpload = async () => {
    try {
      const { key } = await uploadData({ key: `${uniqueId('image-')}.jpg`, data: imgFile }).result;
      const result = await getUrl({ key: key, options: { expiresIn: 3600 } })
      const payload = {
        id: uniqueId('image-'),
        title: imgData.title,
        description: imgData.description,
        owner: imgData.owner,
        filePath: result.url.toString(),
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await client.graphql({
        query: createImage,
        variables: { input: payload },
      });
      setImgData({})
      getImageList()
      handleClose()
    }
    catch (error) {
      console.log('Error on fetching songs', error);
    }
  }



  return (
    <div className="App">
      <header className="App-header">
        <Authenticator>
          {({ signOut, user }) => (
            <div className="App-content">
              <div className="Top-bar">
                <span>IMAGE GALLERY</span>
                <div className="Button-container">
                  <button className="Button-primary" onClick={handleOpen}>Add Image</button>
                  <button className="Button-primary" onClick={signOut}>Sign out</button>
                </div>
              </div>
              <div className="Image-container">
                {imageList.map((item, idx) => <Card sx={{ width: 345 }} key={item.id}>
                  <CardHeader
                    title={item.title}
                    subheader={item.createAt}
                  />
                  <CardMedia
                    component="img"
                    height="194"
                    image={item.filePath}
                    alt={item.title}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                  <CardActions disableSpacing>
                    <IconButton aria-label="add to favorites" onClick={() => addFavorites(idx)}>
                      <FavoriteIcon />
                    </IconButton>
                    <span>{item.likes}</span>
                  </CardActions>
                </Card>)}
              </div>
            </div>
          )}
        </Authenticator>
      </header>
      <div>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="Box-style">
          <Typography id="modal-modal-title" variant="h6" component="h2">
            ADD IMAGE
          </Typography>
          <TextField className="text-field" label="Title" value={imgData.title}
            onChange={e => setImgData({ ...imgData, title: e.target.value })} />
          <TextField className="text-field" label="Owner" value={imgData.owner}
            onChange={e => setImgData({ ...imgData, owner: e.target.value })} />
          <TextField className="text-field" label="Description" value={imgData.description}
            onChange={e => setImgData({ ...imgData, description: e.target.value })} />
          <TextField className="text-field" type="file" onChange={e => setImgFile(e.target.files[0])} />
          <button className="Button-primary" onClick={handleUpload} >UPLOAD</button>
        </Box>
      </Modal>
    </div>
  );
}