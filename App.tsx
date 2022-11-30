/* eslint-disable no-trailing-spaces */
import React, {useState, useEffect} from 'react';
import {Text, View, Pressable} from 'react-native';
import {User, UserManager} from 'oidc-client-ts';
import {authTsConfig} from './authTsConfig';

let manager = new UserManager(authTsConfig);
let user = null;

const App = () => {

  const getAuthToken = () => {
    user = manager.getUser().then(user => {
      return user
    });
  };

  useEffect(() => {
    getAuthToken();
  }, [])

  return (
    <View>
      <Pressable onPress={getAuthToken}>
        <Text>Get Auth Token</Text>
      </Pressable>
    </View>
  );
};

export default App;
