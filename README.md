# 紅包拿來 (Fortune Drop): Decentralized Red Envelope Platform

![telegram-cloud-document-5-6084759663792886699](https://github.com/user-attachments/assets/9d1cb707-23e8-40be-bb32-e8a085c80b20)


Our red envelope platform seamlessly integrates traditional red envelope culture with blockchain technology, completely revolutionizing the way red envelopes are shared. On the Aptos blockchain, users can create red envelopes with just one click, using $APT as the amount, enabling global sharing and promoting Chinese red envelope culture worldwide. We have adopted Aptos’ Random API and zero-knowledge proof technology, ensuring through smart contracts that each user can rely on true luck to receive different amounts of $APT. This not only enhances the interactive fun but also guarantees absolute fairness in distribution. Experience a red envelope tradition that is both classic and cutting-edge, while enjoying the transparency and security that blockchain brings!

## Features

- **Create Red Envelopes**  
  Users can easily create red envelopes on the Aptos blockchain using $APT. Simply set the total amount and number of recipients. For security, users also create a dedicated password, which is protected through advanced encryption to prevent unauthorized claims.

- **Password Encryption & Security**  
  We utilize the Blake2b-256 hashing algorithm for password encryption. This modern, highly efficient hash function offers exceptional collision resistance and outperforms traditional SHA-256 in terms of performance, ensuring maximum security for each red envelope.

- **Blockchain Transparency**  
  Every created red envelope is assigned a unique ID and recorded on the blockchain. This enables public access to key information such as the creator, total amount, and number of recipients, ensuring full transparency and trust.

- **Fair & Random Distribution**  
  Using Aptos’ built-in random number generator and zero-knowledge proof, we ensure that the distribution of red envelope funds is unpredictable and fair. Each recipient will receive a random amount, keeping the experience engaging while maintaining fairness.

- **Event-Driven Architecture**  
  Each time a red envelope is created or claimed, a blockchain event is triggered. This event logs the details, including the creator’s address, recipient’s address, red envelope ID, and the amount claimed, ensuring complete traceability and transparency.

## Core Technologies

- **Aptos Roll Random Number API**  
  The red envelope platform leverages Aptos Roll’s secure random number generator (RNG) based on the Weighted Verifiable Random Function (wVRF). This method guarantees unbiased and unpredictable random numbers, ensuring the fairness of each envelope distribution.

- **Weighted Publicly-Verifiable Secret Sharing (wPVSS) and Distributed Key Generation (wDKG)**  
  These technologies further secure the random number generation process by allowing blockchain validators to generate shared keys publicly and securely. wDKG generates random seeds, while wPVSS ensures that the process remains verifiable and tamper-proof.

- **Efficient Hashing with Blake2b-256**  
  Instead of using SHA-256, we employ Blake2b-256 for password verification. This algorithm not only ensures greater security but also enhances performance by reducing gas fees on the blockchain, making our platform more scalable and cost-effective.

- **Event-Driven Transparency**  
  Every red envelope creation or claim triggers a blockchain event, which logs key operational details like transaction amounts and involved addresses. These events are stored immutably and can be viewed via blockchain explorers, providing complete transparency to users.

## Project Summary

By combining traditional red envelope culture with blockchain technology, this platform revolutionizes the way red envelopes are shared. Users can create red envelopes in just a few clicks, distribute $APT tokens globally, and experience the fun of random, fair distribution. With cutting-edge security measures like Blake2b-256 encryption and Aptos Roll’s random number API, we ensure the platform is both secure and scalable.

## Roadmap

- **Explore New Blockchain Scenarios**  
  We will continue to explore additional blockchain application scenarios, expanding the use cases for decentralized asset distribution.

- **Optimize for Larger User Volumes**  
  We are committed to optimizing the platform for scalability to support a growing user base and more complex asset management needs.

- **Enhance User Experience**  
  Future updates will focus on enhancing the user experience, adding more customization options and features for seamless global distribution of digital red envelopes.

## Conclusion

Our decentralized red envelope platform preserves the essence of traditional red envelopes while leveraging state-of-the-art blockchain technology to ensure security, fairness, and transparency. We believe that through this platform, we can both modernize and promote Chinese cultural heritage in the digital age.

---

Feel free to further personalize it by adding links to your repositories, installation guides, or any other details specific to your project!
