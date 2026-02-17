import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readEnv(name) {
  const value = globalThis.process?.env?.[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = readEnv("dra-lueine-barradas");
  const clientEmail = readEnv("firebase-adminsdk-fbsvc@dra-lueine-barradas.iam.gserviceaccount.com");
  const privateKey = readEnv("-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDIOAQVfMZIF1Xb\nJpsslWKfvX9fxVgnjc1rhkEb0o16xGVesTdbItJR17N5t/C+hpsv5oFmun26xm4/\nbVigEu/szEEHS2fBLZC/+aksDAkcEd7QSv0sAst2kIK0xRwFesL41AM1YOa6RRcd\nwVKGucY61DSXanaYEya9owAU8Gh8QL7gfJttQNnIEbOr6kNqOwprEeV3akyJw0O0\nhKl+AxPNbYI0qCh+s6V2XpFFrf2Z1FbD40tlZkAImnk/FYhwJ6rJJuZt40E0e7dg\nDVnxolGvEPXWp2jEvrYdXs8vDCUy/qJdKuCA3UNP5kZTRQYzC7c64lHYNtZGouB+\ndCOT3F5jAgMBAAECggEAFK+uQwFpGRy0GwLnncPHdKVRtOBBBevW5qjwhC03vztD\nFUquY0+l4Z0tfBd0Rl3GSJItGiM4Mfp7fI58eCQiFC9cTqJ3U1RftBNZlmVInFT/\nq49ROLax3+D5aC+aAA+Zd7er/Iazqq4lv8Yavom7gJYujYW16sDGdr8Rwe1pgODJ\ngEBbYTlSiljz+Wowf0bZFxYzG/0lMuNhnyNm2mQR3ubnSl07hZEgWDOloI2h32nI\niIIVrwk9ROJ7IjRawd1fzpBX89T642Cn+NOMDsC2MITj2s4ldES/6ZceW4P+OM4O\noT5zPxvXY+ItBYhpXRFVx83flvLymiTP0Y6F022xRQKBgQDovdZPhiLSgw6nsb7L\nOSzxRxzGnw0nzoYgRlmINsELweW9PvcUAlxivwK5L8MYpDkykOTCoenYGA5iqr+E\nlGXl3kijSuGEI0Qubaw9GDHvuYgd0Is4IDaGiROnlqmNKiYAGqBU+CpjeXCF9ZTN\n4pvdECc1aQuOSVoqS0nq0VCQnwKBgQDcOiiWnQhMTkMph1e2uFEZD55ofjvqk3s5\nWgDv8pQiAdXCOjxQ91dvIKPXku4vuMSf2Ys7wHIEL77Rlinu4TCdKlQYN/+tD6vk\nj56V503apoIBZyfBbEXwxLRpkGT/jwuoR2CkalEy9hosR3qjZEp3akREgq68Sabg\n8jFSQ0rHvQKBgQDl2rZRC5RQewZ6L1zSr8Dm+Og+cM45RgnIzjGWCR1WU0RlRk4W\nAM7k5uf1pGn1aBrlCZwjbGzZ8cgjQaardTO9dW4fdtCKA5pOkBnOrJqEuqLnbxJP\nd+DhtXcnx+/jboDhEWrO/9g9La4nXoZ7XxW3mUBfy0KSX3cg1gJGWjpK2QKBgFvm\n9UstCup0+ngZH9SDhGxV5UAr9asFkrWzRpLbg0/RvjeIf+U14sngMB9lFHrbu0oN\nyZnMzIfMuO/Tn3othVEA+gkFTXAWCyCdgouB9C5bsAMP3jpMib9ZBwTKmis/sZiu\n+LiEGZCPvQpfZeFLl/vPX9/LPUob3kUfLM/sfwdtAoGBALeOoLtliT/BJG+E0i/F\n5X1ljeUP/Gji6qCOsR6t9Pic4k4PgbFYpDnrzqC4rfogD3Ph2gbZrO0wY0FbONTc\n6R4ppSjMM0aaSC5KiyUvNEF5Gq5S8VNj8kuZ+uOmpsY7Ihn4+7R3/p+WrbcM4DEo\n3V0suXibh2bma/D1I9ovlq3g\n-----END PRIVATE KEY-----\n").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}
