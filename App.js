import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { StatusBar } from "expo-status-bar";
import { encode } from "base-64";
import { Text, Button } from "@rneui/themed";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  const processResult = async ({ type, data }) => {
    setScanned(true);
    console.log(`loaded data`, data);
    const b64encodedvds = encode(data);
    try {
      console.log(`b64encodedvds`, b64encodedvds);
      const response = await fetch(`http://172.20.10.8:8000/api/v1/decode`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vds: b64encodedvds,
        }),
      });
      const { success, message, vds } = await response.json();
      console.log(`success, message, vds`, success, message, vds);
      if (success === true) {
        setResult(vds);
        // alert(`${vds}`);
      } else {
        throw new Error(message);
      }
    } catch (error) {
      console.log(`error`, error);
      setErrorMessage(error);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <>
      {scanned ? (
        <>
          {!!result && (
            <SafeAreaView style={{flex:1, backgroundColor:'white'}}>
              <Text h1={true} h1Style={{color:"#841584", alignSelf:'center', marginBottom:20}}>{result.header["Type de document"]}</Text>
              <ScrollView style={{paddingHorizontal:'10%'}}>
              {!!result.data
              ? Object.keys(result).map((part, index) => {
                console.log(`key`, result.part);
                  return (
                    <>
                      <Text h3={true} h3Style={{color:"#841584", marginBottom:10}}>{part}</Text>
                      {Object.keys(result[part]).map((key, index) => {
                        return (
                          <>
                            <Text>
                              {key} : {result[part][key]}
                            </Text>
                          </>
                        );
                      })}
                    </>
                  );
                })
              : ""}
              </ScrollView>
              <Button
                title="Scan Again"
                buttonStyle={{
                  backgroundColor: '#841584',
                  borderWidth: 2,
                  borderColor: 'white',
                  borderRadius: 30,
                }}
                containerStyle={{
                  marginHorizontal: '25%',
                }}
                titleStyle={{ fontWeight: 'bold' }}
                onPress={() => {
                  setResult(null);
                  setErrorMessage(null);
                  setScanned(false);
                }}
              />
            </SafeAreaView>
          )}
        </>
      ) : (
        <>
          {console.log("camera", hasPermission)}
          <View style={styles.container}>
            <BarCodeScanner
              barCodeTypes={[
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.datamatrix,
              ]}
              onBarCodeScanned={scanned ? undefined : processResult}
              style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
});
