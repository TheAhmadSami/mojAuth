/* eslint-disable no-trailing-spaces */
import React from 'react';
import {Text, View, Pressable} from 'react-native';
// import {User, UserManager} from 'oidc-client-ts';
import {authTsConfig} from './authTsConfig';

// let manager = new UserManager(authTsConfig);

const App = () => {

  const getAuthToken = () => {
  };

  return (
    <View>
      <Pressable onPress={getAuthToken}>
        <Text>Get Auth Token</Text>
      </Pressable>
    </View>
  );
};

export default App;
